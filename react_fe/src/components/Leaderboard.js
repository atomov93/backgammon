// src/components/Leaderboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('http://localhost:8080/leaderboard');
        setLeaderboard(response.data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <Box my={4} mx={2}>
      <Typography variant="h4" align="center" gutterBottom>
        Leaderboard
      </Typography>
      <List>
        {leaderboard.map((user, index) => (
          <ListItem key={user._id}>
            <ListItemText primary={`${index + 1}. ${user.username}`} secondary={`Wins: ${user.wins}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Leaderboard;
