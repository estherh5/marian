# Roadmap

Committed doc, not scratch. Kept current by hand as work ships.
**Shipped** = live in production. **Next** = intended, not promised.
**Declined** = decided against, with the reason, so it doesn't get re-proposed.
**Open questions** = unresolved calls, with what would settle them.

## Next

- [security] **Retired keys remain reachable via GitHub refs (Low).** Old commits with the retired Alpha Vantage and tickerapi keys remain reachable through 75 read-only `refs/pull/*` on GitHub and cached SHAs (history already rewritten 2026-09-28). Ask GitHub Support to purge them.

- [security] **Deactivate the old Alpha Vantage key (Low).** Ask Alpha Vantage support to deactivate the key that was in public history (`src/app/stock.service.ts`, hash12 978a2f46ada9).

- [security] **Dead tickerapi.com key in public history (Low).** `src/app/search/search.service.ts` (commit 2bcbdbe, hash12 d0c86761209f); provider removed in e469afc. Fix: revoke it on tickerapi.com if the account exists.

- [security] **Public unauthenticated API proxies (Low).** `netlify/functions/{company,daily,news,quote}.mjs` proxy Alpha Vantage/Finnhub, so anyone can burn the free-tier quota. Fix: cache headers or a basic rate limit.
