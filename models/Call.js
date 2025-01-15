const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  callSid: {
    type: String,
    required: true,
    unique: true
  },
  parentCallSid: {
    type: String,
    default: null
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled', 'on-hold', 'transferring'],
    default: 'queued'
  },
  type: {
    type: String,
    enum: ['direct', 'ivr', 'queue', 'transfer'],
    default: 'direct'
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  transferredFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  transferredTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  conference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference'
  },
  recording: {
    recordingSid: String,
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'failed'],
      default: 'in-progress'
    },
    duration: Number,
    url: String
  },
  queue: {
    name: String,
    enteredAt: Date,
    exitedAt: Date,
    position: Number
  },
  ivr: {
    path: [String],
    selections: [{
      digit: String,
      timestamp: Date
    }]
  },
  metrics: {
    queueDuration: Number,
    callDuration: Number,
    holdDuration: Number,
    transferCount: {
      type: Number,
      default: 0
    }
  },
  notes: [{
    text: String,
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String]
}, {
  timestamps: true
});

// Add indexes for common queries
CallSchema.index({ callSid: 1 });
CallSchema.index({ agent: 1 });
CallSchema.index({ status: 1 });
CallSchema.index({ createdAt: 1 });
CallSchema.index({ 'queue.name': 1 });

// Calculate durations before saving
CallSchema.pre('save', function(next) {
  if (this.queue && this.queue.enteredAt && this.queue.exitedAt) {
    this.metrics.queueDuration = Math.floor((this.queue.exitedAt - this.queue.enteredAt) / 1000);
  }
  next();
});

module.exports = mongoose.model('Call', CallSchema);
