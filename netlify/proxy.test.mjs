// Proxy function tests. Run with `npm run test:functions`. Lives outside
// netlify/functions/ so Netlify does not deploy it as a function.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { handler as quote } from "./functions/quote.mjs";
import { getSymbol } from "./functions/_lib.mjs";

const realFetch = globalThis.fetch;
afterEach(() => (globalThis.fetch = realFetch));

function stubFetch(status, body) {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return new Response(JSON.stringify(body), { status });
  };
  return calls;
}

test("getSymbol accepts real tickers and rejects junk", () => {
  const sym = (symbol) => getSymbol({ queryStringParameters: { symbol } });
  assert.equal(sym(" aapl "), "AAPL");
  assert.equal(sym("BRK.B"), "BRK.B");
  assert.equal(sym("BC/PB"), "BC/PB");
  assert.equal(sym("A".repeat(13)), null);
  assert.equal(sym("AAPL&function=X"), null);
  assert.equal(sym(""), null);
  assert.equal(getSymbol({}), null);
});

test("invalid symbol is rejected without an upstream call", async () => {
  const calls = stubFetch(200, {});
  const res = await quote({ queryStringParameters: { symbol: "x y" } });
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("good upstream response gets a CDN cache header", async () => {
  const calls = stubFetch(200, { c: 1 });
  const res = await quote({ queryStringParameters: { symbol: "aapl" } });
  assert.equal(res.statusCode, 200);
  assert.match(calls[0], /symbol=AAPL/);
  assert.equal(
    res.headers["netlify-cdn-cache-control"],
    "public, durable, s-maxage=60, stale-while-revalidate=60",
  );
});

for (const [label, status, body] of [
  ["Alpha Vantage rate-limit note", 200, { Note: "call frequency exceeded" }],
  ["Alpha Vantage information", 200, { Information: "premium endpoint" }],
  ["Alpha Vantage bad symbol", 200, { "Error Message": "Invalid API call" }],
  ["Finnhub 429", 429, { error: "API limit reached" }],
]) {
  test(`${label} is relayed but never cached`, async () => {
    stubFetch(status, body);
    const res = await quote({ queryStringParameters: { symbol: "AAPL" } });
    assert.equal(res.statusCode, status);
    assert.equal(res.headers["netlify-cdn-cache-control"], undefined);
  });
}
