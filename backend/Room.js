const mongoose = require('mongoose');
const BackgammonGame = require('./BackgammonGame');
const RoomModel = require('./models/Room'); // Import the Mongoose model

class Room {
  constructor(roomName) {
    this.roomName = roomName;
    this.game = new BackgammonGame();
    this.players = [null, null];
  }

  isAvailable() {
    return this.players[0] === null || this.players[1] === null;
  }

  getPlayerCount() {
    return this.players.filter(player => player !== null).length;
  }

  addPlayer(player) {
    if (this.players[0] === null) {
      this.players[0] = player;
    } else if (this.players[1] === null) {
      this.players[1] = player;
    }
  }

  removePlayer(player) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] === player) {
        this.players[i] = null;
        break;
      }
    }
  }

  getPlayers() {
    return this.players;
  }

  getRoomName() {
    return this.roomName;
  }

  getGame() {
    return this.game;
  }

  async save() {
    const roomData = {
      roomName: this.roomName,
      players: this.players.map(player => player ? player.id : null),
      gameState: this.game.getGameStateAsJson(),
    };
    
    let room = await RoomModel.findOne({ roomName: this.roomName });
    if (room) {
      // Update existing room
      room.players = roomData.players;
      room.gameState = roomData.gameState;
      await room.save();
    } else {
      // Create new room
      room = new RoomModel(roomData);
      await room.save();
    }
  }

  async load() {
    const room = await RoomModel.findOne({ roomName: this.roomName });
    if (room) {
      this.players = room.players.map(id => id ? { id } : null);
      this.game.loadGameStateFromJson(room.gameState);
    }
  }

  toString() {
    return JSON.stringify({
      room_name: this.roomName,
      player_count: this.getPlayerCount()
    });
  }

  toLog() {
    return `Room [${this.roomName}] ->\t{ isAvailable: ${this.isAvailable()}, playerCount: ${this.getPlayerCount()} }`;
  }
}

module.exports = Room;
