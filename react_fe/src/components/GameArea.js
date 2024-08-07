import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import DiceDisplay from './DiceDisplay';
import { getServerUrl } from '../api';
import RoomList from './RoomList';

// Message Constants
const USER_NAME = "0";
const GET_ROOMS = "2";
const START_DICE = "3";
const BOTH_PLAYER_CONNECTED = "4";
const AVAILABLE_MOVES = "5";
const MOVE_PLAYED = "6";
const YOU_WON = "7";
const YOU_LOST = "8";
const GAME_STATE = "9";
const IN_GAME_DICE = "A";
const CREATE_ROOM = "B";
const CONNECT_TO_ROOM = "1";

const GameArea = ({ playerUsername }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({ columns: [], captureds: {}, finisheds: {} });
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [dices, setDices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState({ message: 'Not Connected', color: 'red' });
  const [rooms, setRooms] = useState([]);
  const [inGame, setInGame] = useState(false);

  useEffect(() => {
    loadDices();
    initializeSocket();

    // Cleanup on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const loadDices = () => {
    const diceImages = [];
    for (let i = 0; i < 6; i++) {
      diceImages.push(`res/dice_${i + 1}.svg`);
    }
    diceImages.push('res/dice_blank.svg');
    setDices(diceImages);
  };

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, please login.');
      return;
    }

    const newSocket = io.connect(getServerUrl(), {
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      updateServerStatus('Connected', 'green');
      newSocket.emit('action', { action: GET_ROOMS, data: '' });
    });

    newSocket.on('disconnect', () => updateServerStatus('Not Connected', 'red'));
    newSocket.on('response', handleServerResponse);
  };

  const updateServerStatus = (message, color) => {
    setStatus({ message, color });
  };

  const handleServerResponse = (response) => {
    const { action, data } = response;
    console.log('Handling message:', action, data);

    switch (action) {
      case GET_ROOMS:
        setRooms(data);
        break;
      case BOTH_PLAYER_CONNECTED:
        handleBothPlayersConnected(data);
        break;
      case START_DICE:
        startDice(data);
        break;
      case GAME_STATE:
        setGameState(JSON.parse(data));
        break;
      case AVAILABLE_MOVES:
        setPossibleMoves(data);
        highlightMoves(data);
        break;
      case IN_GAME_DICE:
        updateDice(data);
        break;
      case YOU_WON:
        alert('YOU WON!');
        break;
      case YOU_LOST:
        alert('YOU LOST!');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const fetchRooms = () => {
    socket.emit('action', { action: GET_ROOMS, data: '' });
  };

  const handleBothPlayersConnected = (data) => {
    console.log('Both players connected:', data);
    setInGame(true); // Transition to game state
  };

  const startDice = (data) => {
    const [player1, player2] = data;
    const playerDice1 = playerUsername === player1.username ? player2.dice : player1.dice;
    const playerDice2 = playerUsername === player1.username ? player1.dice : player2.dice;

    setTimeout(() => {
      document.getElementById('p1_dice').src = dices[playerDice1 - 1];
      document.getElementById('p2_dice').src = dices[playerDice2 - 1];
    }, 500);

    if (playerUsername !== player1.username) {
      // Rotate the board for opposite player
      document.getElementById('game_area').style.transform = 'scaleY(-1)';
    }
  };

  const updateDice = (diceValues) => {
    const [dice1, dice2] = diceValues.split(',').map(Number);
    setTimeout(() => {
      document.getElementById('p1_dice').src = dices[dice1 - 1];
      document.getElementById('p2_dice').src = dices[dice2 - 1];
    }, 500);
  };

  const highlightMoves = (moves) => {
    setPossibleMoves(moves);
    // Logic to highlight available moves on UI
    moves.forEach((move) => {
      if (move.from >= 0) {
        document.getElementById(`column_${move.from}`).classList.add('selected');
      }
      if (move.to === -2) {
        const collectedDiv = document.getElementById(`collected_${playerUsername === document.getElementById("username_1").innerHTML ? '1' : '2'}`);
        collectedDiv.classList.add("playable");
        collectedDiv.dataset.from = move.from;  // Store the from column for later reference
      } else {
        document.getElementById(`column_${move.to}`).classList.add('playable');
      }
    });
  };

  const handlePieceMove = (from, to) => {
    if (possibleMoves.some((move) => move.from === from && move.to === to)) {
      socket.emit('action', { action: MOVE_PLAYED, data: `${from},${to}` });
    }
  };

  const handleColumnClick = (columnId) => {
    const clickedNum = parseInt(columnId.replace('column_', ''), 10);
    highlightAfterMoves(clickedNum);
  };

  const highlightAfterMoves = (fromVal) => {
    possibleMoves
      .filter((move) => move.from === fromVal)
      .forEach((move) => {
        if (move.to === -2) {
          const collectedDiv = document.getElementById(`collected_${playerUsername === document.getElementById("username_1").innerHTML ? '1' : '2'}`);
          collectedDiv.classList.add("playable");
          collectedDiv.dataset.from = move.from;  // Store the from column for later reference
        } else {
          document.getElementById(`column_${move.to}`).classList.add('playable');
        }
      });
  };

  const handleJoinRoom = (roomName) => {
    if (socket) {
      socket.emit('action', { action: CONNECT_TO_ROOM, data: roomName });
      console.log(`Joining room: ${roomName}`);
    }
  };

  const handleCreateRoom = () => {
    const roomName = prompt("Enter room name:");
    if (roomName && socket) {
      socket.emit('action', { action: CREATE_ROOM, data: roomName });
      console.log(`Creating room: ${roomName}`);
    }
  };

  return (
    <div className="main">
      {!inGame ? (
        <RoomList rooms={rooms} onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} />
      ) : (
        <div className="game_area" id="game_area">
          <img className="image" src="res/game_board.png" alt="Game Board" />
          {gameState.columns.map((column, index) => (
            <div
              key={index}
              className="column"
              id={`column_${index}`}
              onClick={() => handleColumnClick(`column_${index}`)}
            >
              {column.pieces.map((piece, pieceIndex) => (
                <img
                  key={pieceIndex}
                  src={piece.type === 1 ? 'res/white_piece.png' : 'res/black_piece.png'}
                  className="piece"
                  alt={`Piece ${pieceIndex}`}
                  draggable="false"
                  onClick={() => handlePieceMove(index, pieceIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      <DiceDisplay diceValues={dices} />
      <div className="status" style={{ color: status.color }}>
        {status.message}
      </div>
    </div>
  );
};

export default GameArea;
