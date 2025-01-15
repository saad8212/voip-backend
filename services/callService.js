const twilio = require('twilio');
const Call = require('../models/Call');
const Agent = require('../models/Agent');
const Conference = require('../models/Conference');
const { CustomError } = require('../utils/errorHandler');
const { formatPhoneNumber, generateCallbackUrl } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../constants/messages');

class CallService {
  constructor() {
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    this.VoiceResponse = twilio.twiml.VoiceResponse;
  }

  async initiateCall({ to, agentId, callType }) {
    const agent = await Agent.findById(agentId);
    if (!agent) throw new CustomError(ERROR_MESSAGES.AGENT_NOT_FOUND, 404);

    const formattedNumber = formatPhoneNumber(to);
    const twiml = new this.VoiceResponse();

    switch (callType) {
      case 'direct':
        this._setupDirectCall(twiml, formattedNumber);
        break;
      case 'ivr':
        this._setupIVRCall(twiml);
        break;
      case 'queue':
        this._setupQueueCall(twiml);
        break;
      default:
        throw new CustomError(ERROR_MESSAGES.INVALID_CALL_TYPE, 400);
    }

    const call = await this.client.calls.create({
      twiml: twiml.toString(),
      to: formattedNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      statusCallback: generateCallbackUrl('/api/twilio/call-status'),
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      recording: {
        trim: 'trim-silence',
        recordingStatusCallback: generateCallbackUrl('/api/twilio/recording-status')
      }
    });

    const newCall = await Call.create({
      callSid: call.sid,
      direction: 'outbound',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
      status: 'queued',
      agent: agentId,
      type: callType
    });

    await Agent.findByIdAndUpdate(agentId, {
      status: 'busy',
      currentCall: newCall._id
    });

    return newCall;
  }

  async transferCall(callSid, targetAgentId) {
    const [call, targetAgent] = await Promise.all([
      Call.findOne({ callSid }),
      Agent.findById(targetAgentId)
    ]);

    if (!call) throw new CustomError(ERROR_MESSAGES.CALL_NOT_FOUND, 404);
    if (!targetAgent) throw new CustomError(ERROR_MESSAGES.AGENT_NOT_FOUND, 404);

    const twiml = new this.VoiceResponse();
    twiml.say({ voice: 'alice' }, 'Please wait while we transfer your call.');
    
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      action: generateCallbackUrl('/api/twilio/transfer-complete')
    });
    
    dial.client(targetAgent.extension);

    await this.client.calls(callSid).update({
      twiml: twiml.toString()
    });

    await Call.findByIdAndUpdate(call._id, {
      transferredTo: targetAgentId,
      status: 'transferring'
    });

    return { success: true, message: 'Call transfer initiated' };
  }

  async toggleHold(callSid, action) {
    const call = await Call.findOne({ callSid });
    if (!call) throw new CustomError(ERROR_MESSAGES.CALL_NOT_FOUND, 404);

    const twiml = new this.VoiceResponse();
    
    if (action === 'hold') {
      twiml.play({ loop: 0 }, process.env.HOLD_MUSIC_URL);
    } else {
      twiml.redirect(generateCallbackUrl('/api/twilio/resume-call'));
    }

    await this.client.calls(callSid).update({
      twiml: twiml.toString()
    });

    await Call.findByIdAndUpdate(call._id, {
      status: action === 'hold' ? 'on-hold' : 'in-progress'
    });

    return { success: true, status: action === 'hold' ? 'on-hold' : 'in-progress' };
  }

  async manageConference(conferenceId, action, participantSid) {
    const conference = await Conference.findOne({ conferenceSid: conferenceId });
    if (!conference) throw new CustomError(ERROR_MESSAGES.CONFERENCE_NOT_FOUND, 404);

    switch (action) {
      case 'mute':
      case 'unmute':
        await this.client.conferences(conferenceId)
          .participants(participantSid)
          .update({ muted: action === 'mute' });
        break;
      case 'hold':
      case 'unhold':
        await this.client.conferences(conferenceId)
          .participants(participantSid)
          .update({ hold: action === 'hold' });
        break;
      case 'kick':
        await this.client.conferences(conferenceId)
          .participants(participantSid)
          .remove();
        break;
      default:
        throw new CustomError(ERROR_MESSAGES.INVALID_CONFERENCE_ACTION, 400);
    }

    return { success: true, action, participantSid };
  }

  async manageRecording(callSid, action) {
    const call = await Call.findOne({ callSid });
    if (!call) throw new CustomError(ERROR_MESSAGES.CALL_NOT_FOUND, 404);

    switch (action) {
      case 'start':
        await this.client.calls(callSid)
          .recordings
          .create({
            recordingStatusCallback: generateCallbackUrl('/api/twilio/recording-status')
          });
        break;
      case 'stop':
        const recordings = await this.client.calls(callSid).recordings.list();
        if (recordings.length > 0) {
          await this.client.recordings(recordings[0].sid).update({ status: 'stopped' });
        }
        break;
      case 'pause':
      case 'resume':
        await this.client.calls(callSid)
          .recordings
          .update({ status: action });
        break;
      default:
        throw new CustomError(ERROR_MESSAGES.INVALID_RECORDING_ACTION, 400);
    }

    return { success: true, action };
  }

  async getCallMetrics(startDate, endDate, agentId) {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (agentId) query.agent = agentId;

    const metrics = await Call.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    return metrics;
  }

  async handleStatusCallback(payload) {
    const { CallSid, CallStatus, CallDuration } = payload;
    
    const updateData = {
      status: CallStatus.toLowerCase(),
      duration: CallDuration
    };

    const call = await Call.findOneAndUpdate(
      { callSid: CallSid },
      updateData,
      { new: true }
    );

    if (['completed', 'failed', 'busy', 'no-answer'].includes(CallStatus.toLowerCase())) {
      if (call && call.agent) {
        await Agent.findByIdAndUpdate(call.agent, {
          status: 'available',
          currentCall: null
        });
      }
    }

    return { success: true, status: CallStatus };
  }

  // Private helper methods
  _setupDirectCall(twiml, number) {
    twiml.say({ voice: 'alice' }, 'Please wait while we connect your call.');
    twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      answerOnBridge: true,
      record: 'record-from-answer'
    }, number);
  }

  _setupIVRCall(twiml) {
    twiml.gather({
      input: 'dtmf speech',
      timeout: 3,
      numDigits: 1,
      action: generateCallbackUrl('/api/twilio/ivr-handler')
    }).say({
      voice: 'alice',
      language: 'en-US'
    }, 'Welcome to our call center. Press 1 for sales, 2 for support, or 3 for billing.');
  }

  _setupQueueCall(twiml) {
    twiml.enqueue({
      waitUrl: process.env.WAIT_URL,
      workflowSid: process.env.WORKFLOW_SID
    });
  }
}

module.exports = CallService;
