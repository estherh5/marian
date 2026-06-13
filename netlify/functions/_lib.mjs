// Shared helpers for the API proxy functions. The leading underscore keeps
// Netlify from treating this file as its own deployable function.

export function getSymbol(event) {
  const symbol = event.queryStringParameters?.symbol;
  return symbol ? symbol.trim() : null;
}

export function badRequest(message) {
  return {
    statusCode: 400,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

// Fetch an upstream JSON endpoint server-side and relay the response verbatim.
export async function proxyJson(url) {
  try {
    const res = await fetch(url);
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { 'content-type': 'application/json' },
      body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: `Upstream request failed: ${err}` }),
    };
  }
}
