const CallService = require('../services/callService');
const { errorHandler } = require('../utils/errorHandler');
const { validateCallRequest } = require('../utils/validators');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../constants/messages');

class CallController {
  constructor() {
    this.callService = new CallService();
  }

  // Initiate a new call
  initiateCall = async (req, res) => {
    try {
      const { to, agentId, callType = 'direct' } = req.body;
      await validateCallRequest({ to, agentId });
      
      const call = await this.callService.initiateCall({ to, agentId, callType });
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.CALL_INITIATED,
        data: call
      });
    } catch (error) {
      return errorHandler(res, error);
    }
  };

  // Handle call transfer
  transferCall = async (req, res) => {
    try {
      const { callSid, targetAgentId } = req.body;
      const transfer = await this.callService.transferCall(callSid, targetAgentId);
      
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.CALL_TRANSFERRED,
        data: transfer
      });
    } catch (error) {
      return errorHandler(res, error);
    }
  };

  // Handle call hold/resume
  toggleHold = async (req, res) => {
    try {
      const { callSid, action } = req.body;
      const call = await this.callService.toggleHold(callSid, action);
      
      return res.status(200).json({
        success: true,
        message: action === 'hold' ? SUCCESS_MESSAGES.CALL_HELD : SUCCESS_MESSAGES.CALL_RESUMED,
        data: call
      });
    } catch (error) {
      return errorHandler(res, error);
    }
  };

  // Handle conference operations
  manageConference = async (req, res) => {
    try {
      const { conferenceId, action, participantSid } = req.body;
      const conference = await this.callService.manageConference(conferenceId, action, participantSid);
      
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.CONFERENCE_UPDATED,
        data: conference
      });
    } catch (error) {
      return errorHandler(res, error);
    }
  };

  // Handle call recording operations
  manageRecording = async (req, res) => {
    try {
      const { callSid, action } = req.body;
      const recording = await this.callService.manageRecording(callSid, action);
      
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.RECORDING_UPDATED,
        data: recording
      });
    } catch (error) {
      return errorHandler(res, error);
    }
  };

  // Get call metrics and analytics
  getCallMetrics = async (req, res) => {
    try {
      const { startDate, endDate, agentId } = req.query;
      const metrics = await this.callService.getCallMetrics(startDate, endDate, agentId);
      
      return res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      return errorHandler(res, error);
    }
  };

  // Handle webhook for call status updates
  handleStatusCallback = async (req, res) => {
    try {
      console.log('Received call status update:', req.body);
      const statusUpdate = await this.callService.handleStatusCallback(req.body);
      return res.status(200).json(statusUpdate);
    } catch (error) {
      return errorHandler(res, error);
    }
  };
}

module.exports = new CallController();
