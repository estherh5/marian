import { badRequest, getSymbol, proxyJson } from './_lib.mjs';

// Finnhub real-time quote. Keeps FINNHUB_KEY server-side.
export const handler = async (event) => {
  const symbol = getSymbol(event);
  if (!symbol) {
    return badRequest('symbol is required');
  }

  const url =
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}` +
    `&token=${process.env.FINNHUB_KEY}`;
  return proxyJson(url);
};
