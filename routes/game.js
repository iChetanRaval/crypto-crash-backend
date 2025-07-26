import express from 'express';
import Player from '../models/Player.js';
import Round from '../models/Round.js';
import Transaction from '../models/Transaction.js';
import { getPrice } from '../services/priceService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Place Bet
router.post('/bet', async (req, res) => {
  const { playerId, usdAmount, currency, roundNumber } = req.body;
  if (usdAmount <= 0) return res.status(400).json({ error: "Invalid bet" });
  const player = await Player.findById(playerId);
  const price = await getPrice(currency);
  const cryptoAmount = usdAmount / price;
  if (player.wallet[currency] < cryptoAmount) return res.status(400).json({ error: "Insufficient balance" });

  // Atomic update would use a transaction in MongoDB 4.0+
  player.wallet[currency] -= cryptoAmount;
  await player.save();

  // Update current round with bet
  await Round.updateOne({ roundNumber },
    {
      $push: {
        bets: {
          playerId: player._id,
          betUSD: usdAmount,
          betCrypto: cryptoAmount,
          currency,
          time: new Date()
        }
      }
    }
  );

  // Log transaction
  await Transaction.create({
    playerId,
    usdAmount,
    cryptoAmount,
    currency,
    transactionType: "bet",
    transactionHash: uuidv4(),
    priceAtTime: price,
    timestamp: new Date()
  });

  res.json({ success: true });
});

// Cashout
router.post('/cashout', async (req, res) => {
  const { playerId, roundNumber } = req.body;
  const player = await Player.findById(playerId);
  const round = await Round.findOne({ roundNumber });
  if (!round) return res.status(400).json({ error: "Invalid round" });

  const now = Date.now();
  const elapsed = (now - round.startedAt.getTime()) / 1000;
  const growth = 0.1; // example
  const currentMultiplier = 1 + elapsed * growth;

  if (currentMultiplier > round.crashPoint) {
    return res.status(400).json({ error: "Already crashed" });
  }

  const bet = round.bets.find(x => x.playerId.toString() === playerId);
  if (!bet) return res.status(400).json({ error: "No active bet" });

  const cryptoPayout = bet.betCrypto * currentMultiplier;
  const price = await getPrice(bet.currency);

  player.wallet[bet.currency] += cryptoPayout;
  await player.save();

  await Round.updateOne({ roundNumber }, {
    $push: {
      cashouts: {
        playerId,
        cashoutMultiplier: currentMultiplier,
        cryptoWon: cryptoPayout,
        usdWon: cryptoPayout * price,
        time: new Date()
      }
    }
  });

  await Transaction.create({
    playerId,
    usdAmount: cryptoPayout * price,
    cryptoAmount: cryptoPayout,
    currency: bet.currency,
    transactionType: "cashout",
    transactionHash: uuidv4(),
    priceAtTime: price,
    timestamp: new Date()
  });

  res.json({ success: true, cryptoPayout, usdPayout: cryptoPayout * price });
});

// Check wallet
router.get('/wallet/:playerId', async (req, res) => {
  const player = await Player.findById(req.params.playerId);
  if (!player) return res.status(404).json({ error: "Not found" });
  // Convert crypto balance to USD
  const btcPrice = await getPrice("BTC");
  const ethPrice = await getPrice("ETH");

  res.json({
    wallet: player.wallet,
    usd_equivalent: {
      BTC: player.wallet.BTC * btcPrice,
      ETH: player.wallet.ETH * ethPrice
    }
  });
});

export default router;
