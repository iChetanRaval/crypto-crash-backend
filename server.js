import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import gameRoutes from './routes/game.js';
import { randomSeed, getCrashPoint } from './services/provablyFair.js';
import Round from './models/Round.js';
import crypto from 'crypto';
import playerRoutes from './routes/player.js';



dotenv.config();
const app = express();
app.use(express.json());
app.use('/api', gameRoutes);
app.use('/api/players', playerRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

mongoose.connect(process.env.MONGODB_URI, {});

let currentRound = null;

async function startNewRound() {
    const prev = await Round.findOne().sort({ roundNumber: -1 });
    const roundNumber = prev ? prev.roundNumber + 1 : 1;
    const seed = randomSeed();
    const hash = crypto.createHash('sha256').update(seed + roundNumber).digest('hex');

    const crashPoint = getCrashPoint(seed, roundNumber);
    const round = await Round.create({
        roundNumber,
        startedAt: new Date(),
        seed,
        hash,
        crashPoint,
        multiplierHistory: [],
        bets: [],
        cashouts: []
    });

    currentRound = round;
    io.emit('roundStart', { roundNumber, startedAt: round.startedAt, hash, crashPoint: null });

    let step = 0;
    let multiplier = 1;
    const growth = 0.1; // Exponential growth factor
    const roundStart = Date.now();

    const interval = setInterval(async () => {
        step++;
        const elapsed = (Date.now() - roundStart) / 1000;
        multiplier = 1 + elapsed * growth;
        io.emit('multiplierUpdate', { multiplier: parseFloat(multiplier.toFixed(2)) });

        await Round.updateOne({ roundNumber }, {
            $push: { multiplierHistory: { time: elapsed, value: multiplier } }
        });

        if (multiplier >= crashPoint) {
            clearInterval(interval);
            io.emit('roundCrash', { crashPoint: parseFloat(crashPoint.toFixed(2)), hash, seed });
            await Round.updateOne({ roundNumber }, { endedAt: new Date(), crashPoint });
            setTimeout(startNewRound, 10000); // Start new round after 10 seconds
        }
    }, 100);
}

io.on('connection', socket => {
    console.log('Client connected');

    socket.on('cashout', async ({ playerId }) => {
        const round = currentRound;
        if (!round) return socket.emit('error', 'No active round');
        const now = Date.now();
        const elapsed = (now - round.startedAt.getTime()) / 1000;
        const growth = 0.1;
        const currentMultiplier = 1 + elapsed * growth;
        if (currentMultiplier > round.crashPoint) {
            return socket.emit('error', 'Already crashed');
        }
        // Cashout logic similar to POST /cashout above
        // Implement and emit 'playerCashout' as needed
        socket.emit('cashoutSuccess', { playerId, currentMultiplier });
    });

    socket.on('disconnect', () => {
        // Clean up if necessary
    });
});

mongoose.connection.once('open', () => {
    server.listen(process.env.PORT, () => {
        console.log('Server listening on port', process.env.PORT);
        startNewRound();
    });
});

