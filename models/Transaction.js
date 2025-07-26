import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  playerId: mongoose.Schema.Types.ObjectId,
  usdAmount: Number,
  cryptoAmount: Number,
  currency: { type: String },
  transactionType: String, // "bet" or "cashout"
  transactionHash: String,
  priceAtTime: Number,
  timestamp: Date
});

export default mongoose.model('Transaction', transactionSchema);
