const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  response: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Chat', chatSchema);
