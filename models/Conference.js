const mongoose = require('mongoose');

const ConferenceSchema = new mongoose.Schema({
  conferenceSid: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  participants: [{
    participantSid: String,
    type: {
      type: String,
      enum: ['agent', 'customer'],
      required: true
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent'
    },
    phoneNumber: String,
    status: {
      type: String,
      enum: ['joined', 'left', 'muted', 'held'],
      default: 'joined'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date
  }],
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
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number
}, {
  timestamps: true
});

// Add indexes for common queries
ConferenceSchema.index({ conferenceSid: 1 });
ConferenceSchema.index({ status: 1 });
ConferenceSchema.index({ 'participants.agentId': 1 });

// Calculate conference duration before saving
ConferenceSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('Conference', ConferenceSchema);
