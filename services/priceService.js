import axios from 'axios';

let cache = {};
let cacheTime = {};

export async function getPrice(symbol) {
  const now = Date.now();
  if (cache[symbol] && (now - cacheTime[symbol]) < 10000) {
    return cache[symbol];
  }
  const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
    params: { ids: symbol.toLowerCase(), vs_currencies: 'usd' }
  });
  const price = res.data[symbol.toLowerCase()].usd;
  cache[symbol] = price;
  cacheTime[symbol] = now;
  return price;
}
