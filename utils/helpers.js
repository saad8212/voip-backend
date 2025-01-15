const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.startsWith('0')) {
    return '+' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  
  return phoneNumber;
};

const generateCallbackUrl = (path) => {
  return `${process.env.TWILIO_TWIML_BIN_URL}${path}`;
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return {
    hours,
    minutes,
    seconds: remainingSeconds,
    formatted: `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  };
};

const generateConferenceToken = (identity) => {
  const AccessToken = require('twilio').jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  );

  token.identity = identity;
  const grant = new VideoGrant();
  token.addGrant(grant);

  return token.toJwt();
};

const validateE164 = (phoneNumber) => {
  const regex = /^\+[1-9]\d{1,14}$/;
  return regex.test(phoneNumber);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '');
};

module.exports = {
  formatPhoneNumber,
  generateCallbackUrl,
  formatDuration,
  generateConferenceToken,
  validateE164,
  sanitizeInput
};
