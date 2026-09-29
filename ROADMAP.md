# Roadmap

Committed doc, not scratch. Kept current by hand as work ships.
**Shipped** = live in production. **Next** = intended, not promised.
**Declined** = decided against, with the reason, so it doesn't get re-proposed.
**Open questions** = unresolved calls, with what would settle them.

## Next

## Shipped

- 2026-09 — [security] **API proxies no longer burn quota per call.** `netlify/functions/_lib.mjs#proxyJson` caches good responses on Netlify's CDN (quote 60s, daily/news 1h, company 24h) and never caches upstream rate-limit/error bodies; `getSymbol` rejects non-ticker input before any upstream call. Tests: `npm run test:functions`.

## Declined

- 2026-09 — [security] **Deactivate the old Alpha Vantage key.** Nothing to deactivate: Alpha Vantage serves real data for *any* key string (verified 2026-09-29, `GLOBAL_QUOTE` for MSFT returned a live quote with the made-up key `ZZZZINVALID0000` and with the leaked key alike), so the key in public history (hash12 978a2f46ada9) grants nothing an arbitrary string doesn't.
- 2026-09 — [security] **Revoke the dead tickerapi.com key.** The provider is gone: `tickerapi.com` has no A, NS or SOA record (checked via 1.1.1.1 and 8.8.8.8, 2026-09-29), so no account or endpoint exists to accept or revoke the key (hash12 d0c86761209f).
- 2026-09 — [security] **Ask GitHub Support to purge the 75 pre-rewrite `refs/pull/*`.** Every secret they carry is dead: the Alpha Vantage key (any string works, see above), the tickerapi key (domain gone), the old Finnhub key (401 from `/api/v1/quote`), the IEX Cloud key (IEX Cloud shut down 2024). The repo was public, so the strings are already harvested, and a purge would not reach forks or clones anyway; it would only tidy history. Revisit only if non-key sensitive data turns up in those refs (commits 2bcbdbe, 81e8abf).

## Open questions

