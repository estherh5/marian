import { beforeEach } from 'vitest';

/**
 * The real network is out of bounds under test, by default.
 *
 * Wired in through `setupFiles` on the `test` target in angular.json, so the
 * Angular unit-test builder runs it before every spec file.
 *
 * Why: flare's autofix launchd job runs each fleet app's `npm test` with live
 * secrets in its environment, so "the key is unset under test" cannot be what
 * keeps a spec off the wire — in another fleet app (2026-09-05) that
 * coincidence failing turned unit tests into real Resend sends. Here the thing
 * that reaches out on its own is the flare error reporter
 * (src/app/flare/flare.ts), which posts with `fetch`. HttpClient specs already
 * go through HttpTestingController and never touch the wire.
 *
 * An absent secret is a coincidence, not a guard. This is the guard: a spec
 * reaches the wire only by stubbing `fetch` itself.
 *
 * IT IS ASSIGNED AT MODULE LOAD, before any spec file is imported, so a
 * fetch made at a spec's top level or in a `beforeAll` — where no beforeEach
 * reaches — meets the guard too. It is assigned again in a beforeEach (plain
 * assignment, never `vi.stubGlobal`), so a spec that stubs without unstubbing
 * cannot leave the next spec holding its stub, and vitest records the guard —
 * not the real fetch — as the "original" that `vi.unstubAllGlobals()` restores.
 * src/test-network-guard.spec.ts pins every one of these.
 */
const blockNetwork = (async (input: unknown) => {
  const target =
    typeof input === 'string' ? input : ((input as { url?: string })?.url ?? String(input));
  throw new Error(
    `Blocked a real network call from a test: ${target}\n` +
      'Nothing under test may reach the wire. Stub it in the test that needs it:\n' +
      '  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }))',
  );
}) as unknown as typeof fetch;

globalThis.fetch = blockNetwork;

beforeEach(() => {
  globalThis.fetch = blockNetwork;
});
