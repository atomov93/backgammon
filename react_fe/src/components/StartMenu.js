// src/components/StartMenu.js
import React from 'react';

const StartMenu = ({ onCreateRoom, rooms, onJoinRoom }) => {
  return (
    <div className="start">
      <div className="right_div">
        <div className="room_headers">
          <h1 className="state">Rooms</h1>
          <h1 id="waiting_for_player" className="info"></h1>
        </div>
        <div className="rooms">
          {rooms.map((room, index) => (
            <div key={index} className="room" onClick={() => onJoinRoom(room.name)}>
              <h1 className="room_name">{room.name}</h1>
              <h1 className="player_count">{room.player_count}/2</h1>
              <img className="loading_gif" src="res/loading.gif" alt="loading" />
            </div>
          ))}
        </div>
        <h1 className="or">or</h1>
        <div className="create_room_div">
          <button className="button" onClick={onCreateRoom}>Create</button>
          <input className="input" type="text" id="room_name_input" placeholder="Room Name" />
        </div>
      </div>
    </div>
  );
};

export default StartMenu;
