import React, { useEffect, useState } from "react";
import { Container, Box, Button, Typography } from "@mui/material";
import Auth from "./components/Auth";
import RoomList from "./components/RoomList";
import Leaderboard from "./components/Leaderboard";
import logo from "./logo.png";
import { getSocket } from "./socket";


function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState("menu");

  useEffect(() => {
    if (currentView === "play") {
      console.log("vzeh staite")
    }
  }, [currentView]);

  const handleAuthSuccess = () => {
    const socket = getSocket();
    socket.connect();
    setAuthenticated(true);
    const username = localStorage.getItem("username");
    socket.emit("action", { action: "0", data: username });
  };

  const handleMenuSelection = (option) => {
    setCurrentView(option);
  };

  return (
    <div className="App">
      {!authenticated ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : (
        <Container className="main-container" maxWidth="sm">
          {currentView === "menu" && (
            <Box textAlign="center" mt={4}>
              <img
                src={logo}
                alt="Logo"
                className="logo"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              <Typography variant="h4" gutterBottom>
                EGT Backgammon
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => handleMenuSelection("play")}
                sx={{ mt: 2 }}
              >
                Play
              </Button>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => handleMenuSelection("leaderboard")}
                sx={{ mt: 2 }}
              >
                View Leaderboard
              </Button>
            </Box>
          )}
          {currentView === "play" && (
            <RoomList
            />
          )}
          {currentView === "leaderboard" && <Leaderboard />}
        </Container>
      )}
    </div>
  );
}

export default App;
