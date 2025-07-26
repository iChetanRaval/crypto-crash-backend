import mongoose from 'mongoose';

const betSchema = new mongoose.Schema({
  playerId: mongoose.Schema.Types.ObjectId,
  betUSD: Number,
  betCrypto: Number,
  currency: String,
  time: Date
}, { _id: false });

const cashoutSchema = new mongoose.Schema({
  playerId: mongoose.Schema.Types.ObjectId,
  cashoutMultiplier: Number,
  cryptoWon: Number,
  usdWon: Number,
  time: Date
}, { _id: false });

const roundSchema = new mongoose.Schema({
  roundNumber: Number,
  startedAt: Date,
  endedAt: Date,
  seed: String,
  hash: String,
  crashPoint: Number,
  multiplierHistory: [{ time: Number, value: Number }],
  bets: [betSchema],
  cashouts: [cashoutSchema]
});

export default mongoose.model('Round', roundSchema);
