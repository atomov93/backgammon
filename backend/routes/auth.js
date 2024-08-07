// routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Path to the User model
const router = express.Router();

// Secret key for JWT, should be stored securely in an environment variable
const JWT_SECRET = 'KhlM*mf8%a!MgY@U&586YifkVAXRXABDSPE3ePyzYq3k6ydq%Eqsp!qG0NfwiYq3qyWWi7eElq&wos^7Zd*3!Qr%89LO!&Fe2N';

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
  
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const user = new User({ username, password: hashedPassword });
      await user.save();
  
      return res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Login endpoint
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
  
    try {
      // Check if user exists
      const user = await User.findOne({ username });
      if (!user) {
        // Respond with a generic error message
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Compare the password with the hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Respond with a generic error message
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Generate JWT token
      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
      });
  
      return res.json({ token });   
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = router;
