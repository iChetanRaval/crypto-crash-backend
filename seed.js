import mongoose from 'mongoose';
import Player from './models/Player.js';  // Adjust relative path if necessary

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptocrash');

(async () => {
  try {
    await Player.deleteMany({});  // This should now work
    await Player.create([
      { username: 'alice', wallet: { BTC: 0.005, ETH: 0.1 } },
      { username: 'bob', wallet: { BTC: 0.01, ETH: 0.05 } },
      { username: 'carol', wallet: { BTC: 0.002, ETH: 0.2 } }
    ]);
    console.log('Sample players created');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
})();
