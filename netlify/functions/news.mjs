import { badRequest, getSymbol, proxyJson } from './_lib.mjs';

// Finnhub company news for the past year. Keeps FINNHUB_KEY server-side.
export const handler = async (event) => {
  const symbol = getSymbol(event);
  if (!symbol) {
    return badRequest('symbol is required');
  }

  const today = new Date();
  const lastYear = new Date(new Date().setFullYear(today.getFullYear() - 1));
  const toDate = today.toISOString().split('T')[0];
  const fromDate = lastYear.toISOString().split('T')[0];

  const url =
    `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}` +
    `&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_KEY}`;
  return proxyJson(url);
};
