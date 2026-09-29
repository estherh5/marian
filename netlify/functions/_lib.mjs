// Shared helpers for the API proxy functions. The leading underscore keeps
// Netlify from treating this file as its own deployable function.

// Ticker shape: letters, digits, dot, dash and slash (BRK.B, RDS-A, BC/PB). Rejecting
// anything else keeps junk symbols from busting the CDN cache below.
const SYMBOL_RE = /^[A-Z0-9./-]{1,12}$/;

export function getSymbol(event) {
  const symbol = event.queryStringParameters?.symbol?.trim().toUpperCase();
  return symbol && SYMBOL_RE.test(symbol) ? symbol : null;
}

export function badRequest(message) {
  return {
    statusCode: 400,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ error: message }),
  };
}

// Alpha Vantage answers rate limits and bad symbols with HTTP 200 and one of
// these keys, so a 200 alone does not mean the body is worth caching.
const UPSTREAM_ERROR_KEYS = ["Note", "Information", "Error Message", "error"];

function isCacheable(status, body) {
  if (status !== 200) return false;
  try {
    const json = JSON.parse(body);
    return !(
      json &&
      typeof json === "object" &&
      UPSTREAM_ERROR_KEYS.some((k) => k in json)
    );
  } catch {
    return false;
  }
}

// Fetch an upstream JSON endpoint server-side and relay the response verbatim.
// Good responses are cached on Netlify's CDN for `maxAge` seconds (keyed by
// the full URL, symbol included), so repeat callers cost no upstream quota.
export async function proxyJson(url, maxAge) {
  try {
    const res = await fetch(url);
    const body = await res.text();
    const headers = { "content-type": "application/json" };
    if (isCacheable(res.status, body)) {
      headers["netlify-cdn-cache-control"] =
        `public, durable, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}`;
    }
    return { statusCode: res.status, headers, body };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: `Upstream request failed: ${err}` }),
    };
  }
}
