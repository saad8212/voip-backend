const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  tags: [{
    type: String
  }],
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  callHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
