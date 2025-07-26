import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  wallet: {
    BTC: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 }
  }
});

export default mongoose.model('Player', playerSchema);
