// src/socket.js
import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:8080", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    socket.on("connect", () => {
      console.log(`Connected with socket ID: ${socket.id}`);
      localStorage.setItem("socketId", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      localStorage.removeItem("socketId");
    });
  }

  return socket;
};
