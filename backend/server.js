// server.js

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const Player = require("./Player");
const RoomModel = require("./models/Room");
const User = require("./models/User");
const BackgammonGame = require("./BackgammonGame");

const app = express();
app.use(cors());
app.use(express.json());
app.use(authRoutes);

// MongoDB connection
const mongoURI = "mongodb://localhost:27018/backgammon_users";

mongoose
  .connect(mongoURI, {})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Create HTTP server and integrate Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend address
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log(`New client connected with socket ID: ${socket.id}`);

  // Handle actions for the specific socket
  socket.on("action", async (data) => {
    const { action, data: message } = data;
    console.log(`Received action: ${action}, message: ${JSON.stringify(message)}`);

    if (action === '0') {
      if (!Player.players.has(socket.id)) {
        console.log(`Authenticating socket ID: ${socket.id} with username: ${message}`);
        socket.username = message;
        const player = new Player(socket);
        Player.players.set(socket.id, player); // Store player instance
      }
    } else {
      const player = Player.players.get(socket.id);
      if (player) {
        await player.messageHandler({ action, data: message });
      } else {
        console.error(`No player found for socket: ${socket.id}`);
      }
    }
  });

  // socket.on("disconnect", () => {
  //   console.log(`Client disconnected with socket ID: ${socket.id}`);
  //   const player = Player.players.get(socket.id);
  //   if (player) {
  //     player.handleDisconnect();
  //     Player.players.delete(socket.id); // Clean up player map
  //   } else {
  //     console.error(`No player found for socket disconnect: ${socket.id}`);
  //   }
  // });
});

app.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find().sort({ wins: -1 }).limit(10); // Limit to top 10 users for leaderboard
    res.json(users);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/rooms", async (req, res) => {
  try {
    const rooms = await RoomModel.find().populate("players");
    res.json(
      rooms.map((room) => ({
        room_name: room.roomName,
        player_count: room.players.length,
      }))
    );
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/rooms", async (req, res) => {
  const { roomName } = req.body;

  try {
    const existingRoom = await RoomModel.findOne({ roomName });

    if (existingRoom) {
      return res.status(400).json({ error: "Room name is already taken" });
    }

    const newRoom = new RoomModel({
      roomName,
      players: [],
      gameState: new BackgammonGame().getGameStateAsJson(),
    });

    await newRoom.save();
    res.status(201).json({ message: "Room created successfully" });

    // Emit the updated list of rooms to all connected clients
    io.emit("updateRooms", await getRooms());
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function getRooms() {
  const rooms = await RoomModel.find().populate("players");
  return rooms.map((room) => ({
    room_name: room.roomName,
    player_count: room.players.length,
  }));
}

server.listen(8080, () => {
  console.log(`Server running on port 8080`);
});
