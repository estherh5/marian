import { describe, it, expect, vi } from 'vitest';

/**
 * Pins the guard in src/test-network-guard.ts (a `setupFiles` entry on the
 * `test` target in angular.json).
 *
 * flare's autofix job runs `npm test` with live secrets in its environment, so
 * nothing about the environment can be what keeps a spec off the wire. These
 * cases are what stop the guard being quietly deleted or dropped from
 * angular.json.
 */
const fetchAtImport = globalThis.fetch;

describe('the test-environment network guard', () => {
  it('is already in place when a spec file is imported, before any hook runs', async () => {
    // fetchAtImport was read at this file's top level, where no beforeEach
    // reaches — which is what the module-load assignment in the setup file is for.
    await expect(fetchAtImport('http://127.0.0.1:9/')).rejects.toThrow(/Blocked a real network call/);
  });

  it('refuses an unstubbed fetch, naming the target', async () => {
    await expect(fetch('https://flare.crystalprism.io/api/ingest')).rejects.toThrow(
      /Blocked a real network call from a test: https:\/\/flare\.crystalprism\.io\/api\/ingest/,
    );
  });

  it('tells the reader how to stub it, so the refusal is actionable', async () => {
    await expect(fetch('https://example.com')).rejects.toThrow(/vi\.stubGlobal\("fetch"/);
  });

  it('yields to a test that stubs fetch deliberately', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await expect(fetch('https://example.com')).resolves.toMatchObject({ ok: true });
  });

  it('is reinstated for the next test, so one stub cannot disarm the suite', async () => {
    await expect(fetch('https://example.com')).rejects.toThrow(/Blocked a real network call/);
  });

  it('comes back after vi.unstubAllGlobals — the restore must land on the guard, not the wire', async () => {
    // Discard port on loopback: when this is red, it is red without a packet
    // leaving the machine.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.unstubAllGlobals();
    await expect(fetch('http://127.0.0.1:9/')).rejects.toThrow(/Blocked a real network call/);
  });
});
