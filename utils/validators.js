const { CustomError } = require('./errorHandler');
const { validateE164 } = require('./helpers');

const validateCallRequest = async ({ to, agentId }) => {
  if (!to) {
    throw new CustomError('Phone number is required', 400);
  }

  if (!agentId) {
    throw new CustomError('Agent ID is required', 400);
  }

  const formattedNumber = to.startsWith('0') ? '+' + to.substring(1) : 
                         to.startsWith('+') ? to : '+' + to;

  if (!validateE164(formattedNumber)) {
    throw new CustomError('Invalid phone number format. Please use E.164 format', 400);
  }
};

const validateTransferRequest = async ({ callSid, targetAgentId }) => {
  if (!callSid) {
    throw new CustomError('Call SID is required', 400);
  }

  if (!targetAgentId) {
    throw new CustomError('Target agent ID is required', 400);
  }
};

const validateConferenceRequest = async ({ conferenceId, action, participantSid }) => {
  if (!conferenceId) {
    throw new CustomError('Conference ID is required', 400);
  }

  if (!action) {
    throw new CustomError('Action is required', 400);
  }

  const validActions = ['mute', 'unmute', 'hold', 'unhold', 'kick'];
  if (!validActions.includes(action)) {
    throw new CustomError('Invalid conference action', 400);
  }

  if (!participantSid) {
    throw new CustomError('Participant SID is required', 400);
  }
};

const validateRecordingRequest = async ({ callSid, action }) => {
  if (!callSid) {
    throw new CustomError('Call SID is required', 400);
  }

  if (!action) {
    throw new CustomError('Action is required', 400);
  }

  const validActions = ['start', 'stop', 'pause', 'resume'];
  if (!validActions.includes(action)) {
    throw new CustomError('Invalid recording action', 400);
  }
};

const validateMetricsRequest = async ({ startDate, endDate }) => {
  if (!startDate || !endDate) {
    throw new CustomError('Start date and end date are required', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new CustomError('Invalid date format', 400);
  }

  if (start > end) {
    throw new CustomError('Start date must be before end date', 400);
  }
};

module.exports = {
  validateCallRequest,
  validateTransferRequest,
  validateConferenceRequest,
  validateRecordingRequest,
  validateMetricsRequest
};
