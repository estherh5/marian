import { badRequest, getSymbol, proxyJson } from './_lib.mjs';

// Alpha Vantage company OVERVIEW. Keeps ALPHAVANTAGE_KEY server-side.
export const handler = async (event) => {
  const symbol = getSymbol(event);
  if (!symbol) {
    return badRequest('symbol is required');
  }

  const url =
    `https://www.alphavantage.co/query?function=OVERVIEW` +
    `&symbol=${encodeURIComponent(symbol)}&apikey=${process.env.ALPHAVANTAGE_KEY}`;
  return proxyJson(url);
};
