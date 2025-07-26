import express from 'express';
import Player from '../models/Player.js';

const router = express.Router();

// Create a new player
router.post('/', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    // Check if username already exists
    const existing = await Player.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already exists' });

    const newPlayer = new Player({ username, wallet: { BTC: 0, ETH: 0 } });
    await newPlayer.save();

    res.status(201).json({ playerId: newPlayer._id, username: newPlayer.username, wallet: newPlayer.wallet });
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get player info by ID
router.get('/:playerId', async (req, res) => {
  try {
    const player = await Player.findById(req.params.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    res.json(player);
  } catch (err) {
    console.error('Error fetching player:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    console.error('Error fetching players:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
