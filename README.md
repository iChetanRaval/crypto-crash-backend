# Crypto Crash Backend

> Backend server implementation for the "Crypto Crash" online game.  
> Players bet USD converted to cryptocurrency, watch a multiplier increase exponentially, and cash out before the game crashes.

---

## Features

- Automated game rounds starting every 10 seconds
- Players bet in USD, converted to BTC/ETH at real-time prices
- Exponentially increasing multiplier with random, provably fair crash points
- Real-time multiplayer updates using WebSockets (Socket.IO)
- Player wallets storing crypto balances with transaction logs
- Simulated blockchain transactions with mock hashes
- Robust MongoDB data persistence

---

## Tech Stack

- Node.js with Express.js
- MongoDB and Mongoose
- Socket.IO for real-time communication
- External crypto price API (CoinGecko)
- JavaScript ES Modules

---

## Installation

### Prerequisites

- Node.js v16+ ([Download Node.js](https://nodejs.org/))
- MongoDB (local or remote) ([Download MongoDB](https://www.mongodb.com/try/download/community))
- npm (comes with Node.js)

### Steps

1. Clone the repo:
   git clone https://github.com/ichetanraval/crypto-crash-backend.git
   cd crypto-crash-backend


2. Install dependencies:


3. Create a `.env` file in the root directory with:
MONGODB_URI=mongodb://localhost:27017/cryptocrash
PORT=5000


4. Make sure MongoDB is running locally or update the URI accordingly.

5. Seed the database with sample players:

node seed.js


6. Start the server:

npm start


- Server will listen on the configured port (default 5000).  
- Confirm with console message:  


---

## API Endpoints

| Method | Endpoint              | Description                           | Request Body                      | Response                            |
|--------|-----------------------|------------------------------------|----------------------------------|-----------------------------------|
| POST   | `/api/players`        | Create a new player                 | `{ "username": "alice" }`          | Player object with ID and wallet  |
| GET    | `/api/players`        | List all players                   | None                             | Array of players                   |
| GET    | `/api/players/:id`    | Get player by ID                   | None                             | Player object                     |
| GET    | `/api/wallet/:playerId` | Get wallet balances (crypto + USD) | None                             | Wallet with USD equivalent amounts|
| POST   | `/api/bet`            | Place a bet in USD, converted to crypto | `{ playerId, usdAmount, currency, roundNumber }` | Success or error              |
| POST   | `/api/cashout`        | Cash out winnings during round      | `{ playerId, roundNumber }`      | Payout details or error            |

---

## WebSocket Events

Connect to Socket.IO server: `http://localhost:5000`

### Events emitted by server

- `roundStart`  
Payload: `{ roundNumber, startedAt, hash, crashPoint: null }`

- `multiplierUpdate` (every ~100ms)  
Payload: `{ multiplier }`

- `playerCashout`  
Payload: `{ playerId, cryptoPayout, usdPayout }`

- `roundCrash`  
Payload: `{ crashPoint, hash, seed }`

### Events listened to from client

- `cashout`  
Payload: `{ playerId }` — client requests to cash out during active round

---

## Provably Fair Algorithm

- Crash multiplier calculated deterministically using SHA-256 hashing of a random seed + round number.
- Produces a floating point crash multiplier between 1 and 100,
- After each round, seed and hash published for players to verify the fairness.

mport crypto from 'crypto';

function getCrashPoint(seed, roundNumber) {
const hash = crypto.createHash('sha256').update(seed + roundNumber).digest('hex');
const h = parseInt(hash.substring(0, 13), 16) / Math.pow(2, 52);
if (h === 0) return 100;
let crash = Math.floor((1 / (1 - h)) * 100) / 100;
return Math.max(1, Math.min(crash, 100));
}


---

## USD-to-Crypto Conversion

- Uses [CoinGecko API](https://www.coingecko.com/en/api) for real-time BTC and ETH prices.
- Prices cached for 10 seconds to avoid rate limits.
- Bets accept a USD amount and chosen cryptocurrency — converted at the bid time price.
- Wallet balances stored in crypto units.
- Cashouts convert crypto payout back to USD for display.

---

## Testing

### Using Postman or CURL

- **Create player**:  
  POST `http://localhost:5000/api/players`  
  Body:
{
"username": "alice"
}


- **Get player info**:  
GET `http://localhost:5000/api/players/{playerId}`

- **Check wallet**:  
GET `http://localhost:5000/api/wallet/{playerId}`

- **Place bet**:  
POST `http://localhost:5000/api/bet`  
Body:
{
"playerId": "playerId_here",
"usdAmount": 10,
"currency": "BTC",
"roundNumber": 1
}


- **Cash out**:  
POST `http://localhost:5000/api/cashout`  
Body:

{
"playerId": "playerId_here",
"roundNumber": 1
}


---

## Project Structure

crypto-crash-backend/
│
├─ models/
│ ├─ Player.js
│ ├─ Round.js
│ └─ Transaction.js
│
├─ routes/
│ ├─ game.js
│ └─ player.js
│
├─ services/
│ ├─ priceService.js
│ └─ provablyFair.js
│
├─ seed.js
├─ server.js
├─ package.json
├─ .env
└─ README.md
