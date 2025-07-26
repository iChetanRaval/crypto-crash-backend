import crypto from 'crypto';

export function getCrashPoint(seed, roundNumber) {
  const hash = crypto.createHash('sha256').update(seed + roundNumber).digest('hex');
  const h = parseInt(hash.substr(0, 13), 16) / Math.pow(2, 52);
  if (h === 0) return 100; // instant crash protection
  let crash = Math.floor((1 / (1 - h)) * 100) / 100;
  return Math.max(1, Math.min(crash, 100)); // crash between 1x and 100x
}

export function randomSeed() {
  return crypto.randomBytes(16).toString('hex');
}
