# Roadmap

Committed doc, not scratch. Kept current by hand as work ships.
**Shipped** = live in production. **Next** = intended, not promised.
**Declined** = decided against, with the reason, so it doesn't get re-proposed.
**Open questions** = unresolved calls, with what would settle them.

## Next

- [from 2026-10-17] **Upgrade typescript to 7.** Held 2026-10-05: peer ranges cap below 7 — `typescript-eslint@8.71.0` requires `typescript >=4.8.4 <6.1.0` and `@angular/build@22.2` requires `typescript >=6.0 <6.1` (Dependabot #79). Retry when both typescript-eslint and @angular/build publish a release whose typescript peer range admits 7.x.

## Shipped

- **2026-10 — Price direction comes from the live quote.** `isRising` was set in `getPriceHistory` by comparing the live price with the last close in Alpha Vantage's daily series, which already holds today, so a stock up 1.29% showed in red (and it read `false` whenever the history beat the quote). `getCurrentPrice` now sets it from the Finnhub quote's own change (`d`), `null` when Finnhub has none; the price shows as soon as the quote arrives. `app.component.spec.ts` pins the up, down and unknown-symbol cases.
- **2026-10 — Chart and price-change ink pass contrast.** The price chart's line, volume bars and dividend markers (`SERIES_COLOR` in `ChartComponent`) moved from `#21c6ce` (2.1:1 on white) to `#0b7077` (5.8:1). Rising/falling ink, both the trendline (`UP_COLOR`/`DOWN_COLOR`) and the `.up`/`.down` price text, moved from `#05d405`/`#ff0000` (2.0:1, 4.0:1) to `#078a07`/`#cc0000` (4.5:1, 5.9:1), with darker hovers; the calculator's `.error` shares the red. In `NetChartComponent`, the four per-stock line colors under 3:1 became goldenrod, orange, gray and purple, and the Net line takes the new green.
- **2026-10 — Controls and the title pass contrast.** The global `button` (the search button), the About chips (`.item` in `CompanyComponent`), the `:focus` input border and the search results' border moved from `#21c6ce` (white on it was 2.1:1) to `#0b7077` (5.8:1); hover darkens to `#085a60`, a chip link's hover underlines instead of turning `#d2d2d2` (3.9:1), and buttons get a 2px `:focus-visible` ring (the 1px focus border matched their fill). `#title` (`HeaderComponent`) sits on a white tab with rounded bottom corners, so the wordmark reads 5.8:1 whatever part of `background.svg` passes behind it.
- **2026-10 — Links pass contrast.** The global `a, .stock-name` ink, the landing intro's `.important` words and the search result rows move from `#21c6ce` (2.1:1) to the fleet accent `#0b7077`: 5.8:1 on white, 4.9:1 on the `#eaeaea` selected row. Hover goes darker (`#085a60`) instead of paler, and link focus is a 2px ring. Gates green: `ng test` 26/26, lint, build.
- **2026-10 — The Marian title no longer floats over the portfolio.** `#title` (`HeaderComponent`) was `position: fixed` with no ground, so cards and charts scrolled under the transparent script wordmark. It is now `position: absolute`: it sits at the top of the page beside the fleet trigger and scrolls away with the content, which already starts below it. The fleet trigger stays fixed because it is an opaque button.
- **2026-10 — Data-credit links pass contrast.** The footer floats over `background.svg`, whose cyan and near-black shapes pass behind the credits (measured: `#0b7077` drops to 2.55:1 on the bare pattern at 1280x720, and some viewports put a near-black shape under them), so no single ink passes. The credits now sit on a white `.credits-plate` (`FooterComponent`) with `#0b7077` links at 5.8:1, underline on hover, and a 2px accent focus ring. Gates green: `ng test` 26/26, lint, build.
- **2026-10 — Fleet apps + account menu and footer.** The legacy table site menu is gone; the vanilla fleet kit (`src/fleet/`, byte-identical to crystalprism.io's `fleet-menu.js` + `fleet.css`, with the React kit's `fleet-fallback.json`) mounts its trigger at the header's trailing end (`HeaderComponent`, fed by `https://crystalprism.io/apps.json` with the bundled fallback) and its footer under the data credits (`FooterComponent`). Accent `#0b7077`, a deep shade of marian's cyan (5.8:1 on white). Gates green: `ng test` 25/25, lint, build.
- **2026-10** Flare reports now carry a wrapped error's `params` and its `cause` chain (`errorDetail` in `src/app/flare/flare.ts`, ported from the Next template), with the template's six cases in `src/app/flare/flare.spec.ts`. Gates green: `ng test` 19/19, lint, build.
- **2026-10** Dev-tooling majors: vitest 5.0.3 (#80), jsdom 30.1.1 (#78), eslint 10.11.0 (#77, plus `@eslint/js@10` now declared directly since eslint 10 no longer ships it). Gates green: `ng test` 13/13, `test:functions` 7/7, lint, build.

- **2026-10** [security] Dependabot on: alerts enabled, `.github/dependabot.yml` (weekly npm, minor+patch grouped, 3-day cooldown), `npm audit fix` cleared 44 of 44 alerts; nothing left (`npm audit`: 0 vulnerabilities).

- 2026-09 — [security] **API proxies no longer burn quota per call.** `netlify/functions/_lib.mjs#proxyJson` caches good responses on Netlify's CDN (quote 60s, daily/news 1h, company 24h) and never caches upstream rate-limit/error bodies; `getSymbol` rejects non-ticker input before any upstream call. Tests: `npm run test:functions`.

## Declined

- 2026-10 — **TypeScript 7 (Dependabot #79).** `ng build` fails at once: `Angular compilation initialization failed. TypeError: Cannot read properties of undefined (reading 'Error')` in `@angular/build`'s `typescript-compilation.js`, which peers `typescript@">=6.0 <6.1"`. Un-decline when an `@angular/build` release widens its typescript peer range to 7.
- **Narrow `ALPHAVANTAGE_KEY` and `FINNHUB_KEY` to the Functions scope (2026-09-30).** Only `netlify/functions/*` read them, so dropping the Builds scope would keep them from build-time npm scripts. Netlify locks "Specific scopes" behind a paid plan ("Upgrade to unlock"), so both stay on Builds, Functions, Runtime. Both are production-only, and Deploy Previews are empty. Revisit only if marian moves to a paid Netlify plan.
- 2026-09 — [security] **Deactivate the old Alpha Vantage key.** Nothing to deactivate: Alpha Vantage serves real data for *any* key string (verified 2026-09-29, `GLOBAL_QUOTE` for MSFT returned a live quote with the made-up key `ZZZZINVALID0000` and with the leaked key alike), so the key in public history (hash12 978a2f46ada9) grants nothing an arbitrary string doesn't.
- 2026-09 — [security] **Revoke the dead tickerapi.com key.** The provider is gone: `tickerapi.com` has no A, NS or SOA record (checked via 1.1.1.1 and 8.8.8.8, 2026-09-29), so no account or endpoint exists to accept or revoke the key (hash12 d0c86761209f).
- 2026-09 — [security] **Ask GitHub Support to purge the 75 pre-rewrite `refs/pull/*`.** Every secret they carry is dead: the Alpha Vantage key (any string works, see above), the tickerapi key (domain gone), the old Finnhub key (401 from `/api/v1/quote`), the IEX Cloud key (IEX Cloud shut down 2024). The repo was public, so the strings are already harvested, and a purge would not reach forks or clones anyway; it would only tidy history. Revisit only if non-key sensitive data turns up in those refs (commits 2bcbdbe, 81e8abf).

## Open questions

