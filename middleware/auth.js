const twilio = require('twilio');
const { CustomError } = require('../utils/errorHandler');

const authenticateRequest = async (req, res, next) => {
  try {
    // Skip authentication for webhook callbacks from Twilio
    if (req.path.includes('status')) {
      const twilioSignature = req.headers['x-twilio-signature'];
      const url = `${process.env.BASE_URL}${req.path}`;
      const params = req.body;

      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        twilioSignature,
        url,
        params
      );

      if (!isValid) {
        throw new CustomError('Invalid Twilio signature', 401);
      }

      return next();
    }

    // For all other routes, check for API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new CustomError('Invalid API key', 401);
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateAgentAccess = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      throw new CustomError('Agent ID is required', 400);
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      throw new CustomError('Agent not found', 404);
    }

    // Add agent to request object for use in controller
    req.agent = agent;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateRequest,
  validateAgentAccess
};
