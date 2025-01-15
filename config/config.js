require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',

  // MongoDB Configuration
  mongoUri: process.env.MONGODB_URI,

  // Twilio Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    apiKey: process.env.TWILIO_API_KEY,
    apiSecret: process.env.TWILIO_API_SECRET,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    applicationSid: process.env.TWILIO_TWIML_APP_SID,
    workspaceSid: process.env.TWILIO_WORKSPACE_SID,
    workflowSid: process.env.TWILIO_WORKFLOW_SID
  },

  // IVR Configuration
  ivr: {
    welcomeMessage: process.env.IVR_WELCOME_MESSAGE || 'Welcome to our call center',
    waitMusic: process.env.WAIT_MUSIC_URL || 'http://com.twilio.music.classical.s3.amazonaws.com/BusyStrings.mp3',
    timeoutSeconds: parseInt(process.env.IVR_TIMEOUT_SECONDS) || 10,
    maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE) || 100,
    recordCalls: process.env.RECORD_CALLS === 'true',
    transcribeRecordings: process.env.TRANSCRIBE_RECORDINGS === 'true'
  },

  // Security Configuration
  security: {
    apiKey: process.env.API_KEY,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',')
  },

  // Queue Configuration
  queues: {
    sales: {
      name: 'sales',
      friendlyName: 'Sales Queue',
      maxSize: parseInt(process.env.SALES_QUEUE_MAX_SIZE) || 50
    },
    support: {
      name: 'support',
      friendlyName: 'Support Queue',
      maxSize: parseInt(process.env.SUPPORT_QUEUE_MAX_SIZE) || 50
    },
    billing: {
      name: 'billing',
      friendlyName: 'Billing Queue',
      maxSize: parseInt(process.env.BILLING_QUEUE_MAX_SIZE) || 30
    }
  }
};

module.exports = config;
