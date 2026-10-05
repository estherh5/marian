# Roadmap

Committed doc, not scratch. Kept current by hand as work ships.
**Shipped** = live in production. **Next** = intended, not promised.
**Declined** = decided against, with the reason, so it doesn't get re-proposed.
**Open questions** = unresolved calls, with what would settle them.

## Next

- [from 2026-10-17] **Upgrade typescript to 7.** Held 2026-10-05: peer ranges cap below 7 — `typescript-eslint@8.71.0` requires `typescript >=4.8.4 <6.1.0` and `@angular/build@22.2` requires `typescript >=6.0 <6.1` (Dependabot #79). Retry when both typescript-eslint and @angular/build publish a release whose typescript peer range admits 7.x.

## Shipped

- **2026-10** Flare reports now carry a wrapped error's `params` and its `cause` chain (`errorDetail` in `src/app/flare/flare.ts`, ported from the Next template), with the template's six cases in `src/app/flare/flare.spec.ts`. Gates green: `ng test` 19/19, lint, build.
- **2026-10** Dev-tooling majors: vitest 5.0.3 (#80), jsdom 30.1.1 (#78), eslint 10.11.0 (#77, plus `@eslint/js@10` now declared directly since eslint 10 no longer ships it). Gates green: `ng test` 13/13, `test:functions` 7/7, lint, build.

- **2026-10** [security] Dependabot on: alerts enabled, `.github/dependabot.yml` (weekly npm, minor+patch grouped, 3-day cooldown), `npm audit fix` cleared 44 of 44 alerts; nothing left (`npm audit`: 0 vulnerabilities).

- 2026-09 — [security] **API proxies no longer burn quota per call.** `netlify/functions/_lib.mjs#proxyJson` caches good responses on Netlify's CDN (quote 60s, daily/news 1h, company 24h) and never caches upstream rate-limit/error bodies; `getSymbol` rejects non-ticker input before any upstream call. Tests: `npm run test:functions`.

## Declined

- **Narrow `ALPHAVANTAGE_KEY` and `FINNHUB_KEY` to the Functions scope (2026-09-30).** Only `netlify/functions/*` read them, so dropping the Builds scope would keep them from build-time npm scripts. Netlify locks "Specific scopes" behind a paid plan ("Upgrade to unlock"), so both stay on Builds, Functions, Runtime. Both are production-only, and Deploy Previews are empty. Revisit only if marian moves to a paid Netlify plan.
- 2026-09 — [security] **Deactivate the old Alpha Vantage key.** Nothing to deactivate: Alpha Vantage serves real data for *any* key string (verified 2026-09-29, `GLOBAL_QUOTE` for MSFT returned a live quote with the made-up key `ZZZZINVALID0000` and with the leaked key alike), so the key in public history (hash12 978a2f46ada9) grants nothing an arbitrary string doesn't.
- 2026-09 — [security] **Revoke the dead tickerapi.com key.** The provider is gone: `tickerapi.com` has no A, NS or SOA record (checked via 1.1.1.1 and 8.8.8.8, 2026-09-29), so no account or endpoint exists to accept or revoke the key (hash12 d0c86761209f).
- 2026-09 — [security] **Ask GitHub Support to purge the 75 pre-rewrite `refs/pull/*`.** Every secret they carry is dead: the Alpha Vantage key (any string works, see above), the tickerapi key (domain gone), the old Finnhub key (401 from `/api/v1/quote`), the IEX Cloud key (IEX Cloud shut down 2024). The repo was public, so the strings are already harvested, and a purge would not reach forks or clones anyway; it would only tidy history. Revisit only if non-key sensitive data turns up in those refs (commits 2bcbdbe, 81e8abf).

## Open questions

