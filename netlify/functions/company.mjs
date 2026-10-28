import { badRequest, getSymbol, proxyJson } from './_lib.mjs';

// Finnhub company profile. Alpha Vantage's OVERVIEW became a premium endpoint,
// so the free key gets a notice instead of data for every symbol. Keeps
// FINNHUB_KEY server-side. A fund or unknown symbol answers `{}`.
export const handler = async (event) => {
  const symbol = getSymbol(event);
  if (!symbol) {
    return badRequest('a valid ticker symbol is required');
  }

  const url =
    `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}` +
    `&token=${process.env.FINNHUB_KEY}`;
  return proxyJson(url, 86400);
};
