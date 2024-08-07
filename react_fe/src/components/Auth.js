import React, { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { TextField, Button, Typography, Container, Box } from "@mui/material";
import { getSocket } from "../socket"; // Import the singleton socket instance

const Auth = ({ onAuthSuccess }) => {
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
  });
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  const loginAfterRegister = async (credentials) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/login",
        credentials
      );
      const token = response.data.token;
      localStorage.setItem("token", token);
      alert("Registration and Login successful!");
      onAuthSuccess();
    } catch (error) {
      const errorMsg = error.response
        ? error.response.data.error
        : "Server not reachable";
      alert("Login failed: " + errorMsg);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/register",
        registerData
      );
      if (response.status === 201) {
        await loginAfterRegister(registerData);
      }
    } catch (error) {
      const errorMsg = error.response
        ? error.response.data.error
        : "Server not reachable";
      alert("Registration failed: " + errorMsg);
    }
  };

  const handleLogin = async () => {
    try {
      const { username, password } = loginData;
      const socketId = localStorage.getItem("socketId");

      const response = await axios.post("http://localhost:8080/login", {
        username,
        password,
        socketId,
      });

      const token = response.data.token;
      const decoded = jwtDecode(token);
      localStorage.setItem("token", token);
      localStorage.setItem("username", decoded.username);
      alert("Login successful!");

      const socket = getSocket();
      socket.emit("action", { action: "0", data: username }); // Authenticate the socket with username
      console.log(socket)

      onAuthSuccess();
    } catch (error) {
      console.error("Error during login:", error);
      const errorMsg = error.response
        ? error.response.data.error
        : "Server not reachable";
      alert("Login failed: " + errorMsg);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        my={4}
        p={3}
        bgcolor="background.paper"
        borderRadius={2}
        boxShadow={2}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Welcome to the EGT Backgammon Table
        </Typography>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Register
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Username"
            variant="outlined"
            value={registerData.username}
            onChange={(e) =>
              setRegisterData({ ...registerData, username: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            type="password"
            label="Password"
            variant="outlined"
            value={registerData.password}
            onChange={(e) =>
              setRegisterData({ ...registerData, password: e.target.value })
            }
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleRegister}
          >
            Register
          </Button>
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            Login
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Username"
            variant="outlined"
            value={loginData.username}
            onChange={(e) =>
              setLoginData({ ...loginData, username: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="normal"
            type="password"
            label="Password"
            variant="outlined"
            value={loginData.password}
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleLogin}
          >
            Login
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Auth;
