const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const Call = require('../models/Call');
const Agent = require('../models/Agent');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const VoiceResponse = twilio.twiml.VoiceResponse;

// Generate Twilio token for client
router.get('/token', async (req, res) => {
  try {
    const { agentId } = req.query;
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const capability = new twilio.jwt.ClientCapability({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    });

    capability.addScope(
      new twilio.jwt.ClientCapability.OutgoingClientScope({
        applicationSid: process.env.TWILIO_TWIML_APP_SID
      })
    );

    capability.addScope(
      new twilio.jwt.ClientCapability.IncomingClientScope(agent.extension)
    );

    const token = capability.toJwt();
    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ message: 'Error generating token', error: error.message });
  }
});

// Generate TwiML for outbound calls
router.post('/twiml', (req, res) => {
  try {
    const twiml = new VoiceResponse();
    
    // For outbound calls, directly connect without any prompts
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      record: 'record-from-answer',
      recordingStatusCallback: `${process.env.BASE_URL}/api/twilio/recording-status`,
      recordingStatusCallbackMethod: 'POST',
      answerOnBridge: true,
      timeout: 30
    });

    // If this is a client-to-phone call
    if (req.body.To) {
      dial.number(req.body.To);
    }
    // If this is a phone-to-client call
    else if (req.body.Direction === 'inbound') {
      dial.client(req.body.agentExtension || 'support');
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error generating TwiML:', error);
    // Even in case of error, return a valid TwiML response
    const twiml = new VoiceResponse();
    twiml.say('An error occurred while processing your call. Please try again.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Initialize a new call
router.post('/initiate-call', async (req, res) => {
  try {
    const { to, agentId } = req.body;
    
    // Get agent information
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    // Format the phone number
    const formattedNumber = to.startsWith('0') ? '+' + to.substring(1) : to.startsWith('+') ? to : '+' + to;

    // Create a new call record
    const newCall = await Call.create({
      agent: agentId,
      to: formattedNumber,
      status: 'initiating'
    });

    // Make the call using the TwiML endpoint
    const call = await client.calls.create({
      url: `${process.env.BASE_URL}/api/twilio/twiml`,
      to: formattedNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      statusCallback: `${process.env.BASE_URL}/api/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    // Update the call record with the SID
    await Call.findByIdAndUpdate(newCall._id, {
      callSid: call.sid
    });

    // Update agent status
    await Agent.findByIdAndUpdate(agentId, {
      status: 'busy',
      currentCall: newCall._id
    });

    res.json({ 
      callSid: call.sid,
      message: 'Call initiated successfully'
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ message: 'Error initiating call', error: error.message });
  }
});

// Handle call status updates
router.post('/call-status', async (req, res) => {
  try {
    const { CallSid, CallStatus } = req.body;
    
    await Call.findOneAndUpdate(
      { callSid: CallSid },
      { status: CallStatus.toLowerCase() }
    );

    // Handle call completion states
    if (['completed', 'failed', 'busy', 'no-answer'].includes(CallStatus.toLowerCase())) {
      const call = await Call.findOne({ callSid: CallSid });
      if (call && call.agent) {
        await Agent.findByIdAndUpdate(call.agent, { 
          status: 'available',
          currentCall: null
        });
      }
    }

    console.log(`Call ${CallSid} status updated to: ${CallStatus}`);
    
    // Return empty TwiML response
    const twiml = new VoiceResponse();
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error updating call status:', error);
    // Even in case of error, return a valid TwiML response
    const twiml = new VoiceResponse();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Handle recording status updates
router.post('/recording-status', async (req, res) => {
  try {
    const { RecordingSid, RecordingStatus, RecordingUrl } = req.body;
    console.log(`Recording ${RecordingSid} status: ${RecordingStatus}, URL: ${RecordingUrl}`);
    
    // Return empty TwiML response
    const twiml = new VoiceResponse();
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error handling recording status:', error);
    // Even in case of error, return a valid TwiML response
    const twiml = new VoiceResponse();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// End a call
router.post('/end-call', async (req, res) => {
  try {
    const { callSid } = req.body;
    await client.calls(callSid).update({ status: 'completed' });
    res.json({ message: 'Call ended successfully' });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ message: 'Error ending call', error: error.message });
  }
});

module.exports = router;
