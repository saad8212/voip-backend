const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Agent = require('../models/Agent');
const bcrypt = require('bcrypt'); // Added bcrypt import

// Agent authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const agent = await Agent.findOne({ email });
    if (!agent) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await agent.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: agent._id, role: agent.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        extension: agent.extension,
        role: agent.role,
        status: agent.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Update agent status
router.put('/status', async (req, res) => {
  try {
    const { agentId, status } = req.body;
    
    const agent = await Agent.findByIdAndUpdate(
      agentId,
      { status },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Get agent's current call details
router.get('/:agentId/current-call', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.agentId)
      .populate('currentCall');
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(agent.currentCall);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching call details', error: error.message });
  }
});

// Get agent's call history
router.get('/:agentId/call-history', async (req, res) => {
  try {
    const calls = await Call.find({ agent: req.params.agentId })
      .sort({ createdAt: -1 })
      .populate('customer');
    
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching call history', error: error.message });
  }
});

// Create test agent
router.post('/create-test', async (req, res) => {
  try {
    const agent = new Agent({
      name: 'Test Agent',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      extension: '1001',
      status: 'available',
      role: 'agent'
    });

    await agent.save();
    res.json({ 
      message: 'Test agent created successfully',
      agentId: agent._id 
    });
  } catch (error) {
    console.error('Error creating test agent:', error);
    res.status(500).json({ message: 'Error creating test agent', error: error.message });
  }
});

module.exports = router;
