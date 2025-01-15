const express = require('express');
const router = express.Router();
const Call = require('../models/Call');

// Get all calls
router.get('/', async (req, res) => {
  try {
    const calls = await Call.find()
      .populate('agent')
      .populate('customer')
      .sort({ createdAt: -1 });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching calls', error: error.message });
  }
});

// Get call by ID
router.get('/:id', async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('agent')
      .populate('customer');
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    res.json(call);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching call', error: error.message });
  }
});

// Update call notes
router.post('/:id/notes', async (req, res) => {
  try {
    const { content, agentId } = req.body;
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    call.notes.push({
      content,
      createdBy: agentId
    });

    await call.save();
    res.json(call);
  } catch (error) {
    res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

// Add tags to call
router.post('/:id/tags', async (req, res) => {
  try {
    const { tags } = req.body;
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    call.tags = [...new Set([...call.tags, ...tags])];
    await call.save();
    res.json(call);
  } catch (error) {
    res.status(500).json({ message: 'Error adding tags', error: error.message });
  }
});

module.exports = router;
