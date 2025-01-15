const SUCCESS_MESSAGES = {
  CALL_INITIATED: 'Call initiated successfully',
  CALL_TRANSFERRED: 'Call transferred successfully',
  CALL_HELD: 'Call placed on hold',
  CALL_RESUMED: 'Call resumed',
  CONFERENCE_UPDATED: 'Conference updated successfully',
  RECORDING_UPDATED: 'Recording status updated successfully',
  AGENT_UPDATED: 'Agent status updated successfully',
  IVR_SETUP: 'IVR menu setup successfully'
};

const ERROR_MESSAGES = {
  AGENT_NOT_FOUND: 'Agent not found',
  CALL_NOT_FOUND: 'Call not found',
  CONFERENCE_NOT_FOUND: 'Conference not found',
  INVALID_CALL_TYPE: 'Invalid call type',
  INVALID_CONFERENCE_ACTION: 'Invalid conference action',
  INVALID_RECORDING_ACTION: 'Invalid recording action',
  INVALID_PHONE_NUMBER: 'Invalid phone number format',
  TWILIO_ERROR: 'Error communicating with Twilio',
  INTERNAL_ERROR: 'Internal server error occurred',
  UNAUTHORIZED: 'Unauthorized access',
  VALIDATION_ERROR: 'Validation error occurred'
};

const IVR_MESSAGES = {
  WELCOME: 'Welcome to our call center',
  MAIN_MENU: 'Press 1 for sales, 2 for support, or 3 for billing',
  INVALID_OPTION: 'Sorry, that\'s not a valid option',
  CONNECTING: 'Please wait while we connect you to an agent',
  QUEUE_MESSAGE: 'All our agents are busy. Please hold and we\'ll connect you shortly',
  GOODBYE: 'Thank you for calling. Goodbye'
};

module.exports = {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  IVR_MESSAGES
};
