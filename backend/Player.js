// Player.js

const Logger = require("./Logger");
const RoomModel = require("./models/Room");
const User = require("./models/User");
const BackgammonGame = require("./BackgammonGame");

class Player {
  static players = new Map(); // Use a Map for player instances

  constructor(socket) {
    this.socket = socket;
    this.logger = new Logger(`CLIENT | ${socket.id}`);
    this.username = "";
    this.isRunning = true;

    socket.on("disconnect", () => this.handleDisconnect());
    socket.on("action", (data) => this.messageHandler(data));

    this.logger.log(`Connection Established: ${socket.id}`);
  }

  handleDisconnect() {
    this.isRunning = false;
    Player.players.delete(this.socket.id);
    this.leaveRoom()
      .then(() => {
        this.logger.log(
          `${this.username}'s connection closed: ${this.socket.id}`
        );
      })
      .catch((error) => {
        console.error("Error while leaving room:", error);
      });
  }

  async messageHandler(data) {
    const { action, data: message } = data;

    switch (action) {
      case "0": // Assuming "0" is USER_NAME action
        console.log(`Received USER_NAME action with message: ${message}`);
        await this.handleUsername(message);
        break;
      case "1": // CONNECT_TO_ROOM
          const { roomName, username } = message;
          console.log(`CONNECT_TO_ROOM action triggered for room: ${roomName}, username: ${username}`);
          this.username = username;
          console.log("kolko pati chat");
          await this.connectToRoom(roomName);
        break;
      case "2": // GET_ROOMS
        await this.sendAvailableRooms();
        break;
      case "6": // MOVE_PLAYED
        await this.handleMove(message);
        break;
      case "B": // CREATE_ROOM
        await this.createRoom(message);
        break;
      default:
        this.logger.log(`Player entered faulty input [ ${message} ]`);
    }
  }

  async handleUsername(username) {
    const existingPlayer = [...Player.players.values()].find(
      (player) => player.username === username
    );
    if (existingPlayer) {
      this.send({
        action: "USERNAME_ALREADY_EXISTS",
        data: "Username already in server",
      });
      this.socket.disconnect();
      return;
    }

    this.username = username;
    Player.players.set(this.socket.id, this);
    console.log(`Player added: ${username} with socket ID: ${this.socket.id}`);
    this.logger.log(`Player sent its username [ ${this.username} ]`);
    this.send({ action: "USER_NAME_CONFIRMED", data: "Connected" });
  }

  async connectToRoom(roomName) {
    try {
      let gameRoom = await RoomModel.findOne({ roomName });
      if (!gameRoom) {
        gameRoom = new RoomModel({
          roomName,
          players: [],
          gameState: new BackgammonGame().getGameStateAsJson(),
        });
        await gameRoom.save();
        console.log(`Created new room: ${roomName}`);
      } else {
        console.log(`Found existing room: ${roomName} with players: ${gameRoom.players.join(', ')}`);
      }

      // Check if the room already has the user
      if (gameRoom.players.includes(this.username)) {
        console.log(`User ${this.username} is already in the room: ${roomName}`);
        return;
      }

      if (gameRoom.players.length >= 2) {
        console.log("Room is full");
        return;
      }

      // Add the user to the room
      gameRoom.players.push(this.username);
      await gameRoom.save();
      console.log(`User ${this.username} added to room: ${roomName}`);

      this.updateRooms();

      if (gameRoom.players.length === 2) {
        await this.startGame(gameRoom);
      }
    } catch (error) {
      console.error(`Error connecting to room: ${error.message}`);
    }
  }

  async startGame(gameRoom) {
    const game = new BackgammonGame(gameRoom.gameState);
    const [player1Username, player2Username] = gameRoom.players;

    const player1 = Player.players.get(player1Username);
    const player2 = Player.players.get(player2Username);

    if (!player1 || !player2) {
      console.error("Error: Player socket not found for one or both players.");
      console.log(`Player1 socket: ${player1 ? player1.socket.id : "null"}`);
      console.log(`Player2 socket: ${player2 ? player2.socket.id : "null"}`);
      return;
    }

    player1.send({
      action: this.BOTH_PLAYER_CONNECTED,
      data: { opponent_name: player2Username },
    });
    player2.send({
      action: this.BOTH_PLAYER_CONNECTED,
      data: { opponent_name: player1Username },
    });

    let player1Dice, player2Dice;
    do {
      player1Dice = game.rollDice();
      player2Dice = game.rollDice();
    } while (player1Dice === player2Dice);

    game.init(player1Dice > player2Dice ? 1 : 0);

    player1.send({
      action: this.START_DICE,
      data: [
        { username: player1Username, dice: player1Dice },
        { username: player2Username, dice: player2Dice },
      ],
    });
    player2.send({
      action: this.START_DICE,
      data: [
        { username: player1Username, dice: player1Dice },
        { username: player2Username, dice: player2Dice },
      ],
    });

    const moves = game.getPossibleMoves();
    gameRoom.gameState = game.getGameStateAsJson();
    await gameRoom.save();

    if (player1Dice > player2Dice) {
      player1.send({ action: this.AVAILABLE_MOVES, data: moves });
    } else {
      player2.send({ action: this.AVAILABLE_MOVES, data: moves });
    }
  }

  async sendAvailableRooms() {
    const rooms = await RoomModel.find({});
    const availableRooms = rooms
      .filter((room) => room.players.length < 2)
      .map((room) => ({
        room_name: room.roomName,
        player_count: room.players.length,
      }));

    this.logger.log("Player asked for available rooms");
    this.send({ action: this.GET_ROOMS, data: availableRooms });
  }

  async handleMove(clippedMessage) {
    const [from, to] = clippedMessage.split(",").map(Number);
    this.logger.log(`Player made a move [from ${from} to ${to}]`);

    const gameRoom = await RoomModel.findOne({
      players: this.username,
    });
    if (!gameRoom) {
      console.error(`Game room not found for player: ${this.username}`);
      return;
    }
    const game = new BackgammonGame(gameRoom.gameState);

    game.move(from, to);

    Player.players.forEach((player) =>
      player.send({ action: this.GAME_STATE, data: game.getGameStateAsJson() })
    );

    const playerTurn =
      game.getTurn() === 1 ? gameRoom.players[0] : gameRoom.players[1];
    const opponent = gameRoom.players.find((p) => p !== playerTurn);

    const playerTurnObj = Player.players.find((p) => p.username === playerTurn);
    const opponentObj = Player.players.find((p) => p.username === opponent);

    if (game.hasWon()) {
      playerTurnObj.send({ action: this.YOU_WON });
      opponentObj.send({ action: this.YOU_LOST });
      this.removeRoom(gameRoom);
      return;
    }

    if (!game.hasResults()) {
      game.switchTurn();
      this.rollAndSendDice(game, gameRoom);
    } else {
      const moves = game.getPossibleMoves();
      if (moves.length === 0) {
        game.switchTurn();
        this.rollAndSendDice(game, gameRoom);
      } else {
        playerTurnObj.send({ action: this.AVAILABLE_MOVES, data: moves });
      }
    }

    gameRoom.gameState = game.getGameStateAsJson();
    await gameRoom.save();
  }

  async rollAndSendDice(game, gameRoom) {
    const dice1 = game.rollDice();
    const dice2 = game.rollDice();
    game.loadDiceResults(dice1, dice2);

    Player.players.forEach((player) =>
      player.send({ action: this.IN_GAME_DICE, data: `${dice1},${dice2}` })
    );

    const moves = game.getPossibleMoves();
    const playerTurn =
      game.getTurn() === 1 ? gameRoom.players[0] : gameRoom.players[1];

    const playerTurnObj = Player.players.find((p) => p.username === playerTurn);

    if (moves.length === 0) {
      game.switchTurn();
      this.rollAndSendDice(game, gameRoom);
    } else {
      playerTurnObj.send({ action: this.AVAILABLE_MOVES, data: moves });
    }

    gameRoom.gameState = game.getGameStateAsJson();
    await gameRoom.save();
  }

  async createRoom(roomName) {
    const existingRoom = await RoomModel.findOne({ roomName });
    if (existingRoom) {
      this.send({
        action: this.CREATE_ROOM,
        data: "Room name is already taken",
      });
    } else {
      const newRoom = new RoomModel({
        roomName,
        players: [],
        gameState: new BackgammonGame().getGameStateAsJson(),
      });
      await newRoom.save();
      this.send({ action: this.CREATE_ROOM, data: "Room created" });
      this.logger.log(`Room created: ${roomName}`);
      this.updateRooms(); // Notify all players of the updated rooms
    }
  }

  async leaveRoom() {
    try {
      const gameRoom = await RoomModel.findOne({
        players: this.username,
      });

      if (gameRoom) {
        gameRoom.players = gameRoom.players.filter(
          (username) => username !== this.username
        );
        await gameRoom.save();
        this.updateRooms();
      } else {
        console.error(`No game room found for player: ${this.username}`);
      }
    } catch (error) {
      console.error("Error while leaving room:", error);
    }
  }

  async removeRoom(gameRoom) {
    await RoomModel.deleteOne({ _id: gameRoom._id });
    this.logger.log(`Room removed: ${gameRoom.roomName}`);
    this.updateRooms();
  }

  updateRooms() {
    RoomModel.find({})
      .then((rooms) => {
        const roomData = rooms.map((room) => ({
          room_name: room.roomName,
          player_count: room.players.length,
        }));
        Player.players.forEach((player) =>
          player.send({ action: this.GET_ROOMS, data: roomData })
        );
      })
      .catch((error) => {
        console.error("Error updating rooms:", error);
      });
  }

  send(data) {
    this.socket.emit("response", data);
  }
}

module.exports = Player;
