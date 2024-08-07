const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomName: { type: String, required: true, unique: true },
  players: [{ type: String }], // Store usernames as strings instead of ObjectIds
  gameState: { type: Object, required: true }
});

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);
