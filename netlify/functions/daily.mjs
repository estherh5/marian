import { badRequest, getSymbol, proxyJson } from './_lib.mjs';

// Alpha Vantage daily price history (free-tier "compact" = latest 100 days).
// Keeps ALPHAVANTAGE_KEY server-side.
export const handler = async (event) => {
  const symbol = getSymbol(event);
  if (!symbol) {
    return badRequest('symbol is required');
  }

  const url =
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY` +
    `&symbol=${encodeURIComponent(symbol)}&outputsize=compact` +
    `&apikey=${process.env.ALPHAVANTAGE_KEY}`;
  return proxyJson(url);
};
