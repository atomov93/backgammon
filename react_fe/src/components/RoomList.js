import React, { useEffect, useState } from "react";
import { getSocket } from "../socket";

const CONNECT_TO_ROOM = "1";

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loadingRoom, setLoadingRoom] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on("updateRooms", (updatedRooms) => {
      console.log("Received updated rooms:", updatedRooms);
      setRooms(updatedRooms);
    });

    socket.on("waitingForPlayer", () => {
      alert("Waiting for the second player to join...");
    });

    // socket.on("startGame", ({ opponent }) => {
    //   alert(`Game started against ${opponent}`);
    //   setLoadingRoom(null);
    //   onJoinRoom();
    // });

    // socket.on("response", (data) => {
    //   if (data.action === GET_ROOMS) {
    //     console.log("Received rooms data from server:", data.data);
    //     setRooms(data.data);
    //   }
    // });

    return () => {
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:8080/rooms");
      const data = await response.json();
      console.log("Fetched rooms from server:", data);
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleJoinRoom = (roomName) => {
	debugger
    const username = localStorage.getItem("username");

    if (!username) {
      console.error("Username not found, please login.");
      return;
    }

    const room = rooms.find((r) => r.room_name === roomName);
    if (room && room.player_count < 2) {
      const socket = getSocket();

      if (loadingRoom !== roomName) {
        console.log(`Connecting to room: ${roomName}`);
        socket.emit("action", {
          action: CONNECT_TO_ROOM,
          data: { roomName, username },
        });
        setLoadingRoom(roomName); // Set loading state only once
      } else {
        console.log(`Already joining room: ${roomName}`);
      }
    } else {
      console.error("Room is full or not found.");
    }
  };

  const handleCreateRoom = async () => {
    const roomName = prompt("Enter room name:");
    if (roomName) {
      try {
        const response = await fetch("http://localhost:8080/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ roomName }),
        });

        if (response.ok) {
          alert("Room created successfully!");
          fetchRooms();
        } else {
          const errorData = await response.json();
          alert(`Failed to create room: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error creating room:", error);
        alert("Error creating room. Please try again later.");
      }
    }
  };

  return (
    <div className="rooms">
      <h2>Available Rooms</h2>
      {rooms.length === 0 ? (
        <p>No rooms available. Create a new room to start playing!</p>
      ) : (
        rooms.map((room, index) => (
          <div
            key={index}
            className={`room ${room.player_count < 2 ? "active" : "full"}`}
            data-room-name={room.room_name}
          >
            <h1 className="room_name">{room.room_name}</h1>
            <h1 className="player_count">{room.player_count}/2</h1>
            <button
              onClick={() => handleJoinRoom(room.room_name)}
              disabled={room.player_count >= 2 || loadingRoom === room.room_name}
            >
              {loadingRoom === room.room_name ? (
                <span className="loading">Loading...</span>
              ) : room.player_count < 2 ? (
                "Join Room"
              ) : (
                "Room Full"
              )}
            </button>
          </div>
        ))
      )}
      <button onClick={handleCreateRoom}>Create New Room</button>
	  <button onClick={fetchRooms}>Refresh rooms</button>
    </div>
  );
};

export default RoomList;
