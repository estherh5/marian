// PORTED from flare/reporters/next/lib/flare.ts — see that file for the
// canonical source and full rationale. This is a genuine port, not a copy:
// Angular has no build-time env-var injection (no NEXT_PUBLIC_, no
// import.meta.env), so ENDPOINT/KEY/RELEASE come from the generated
// src/app/flare/flare-config.ts (written by scripts/gen-flare-env.mjs at
// Netlify build time, gitignored so the key can never be committed) instead
// of process.env, and the production gate reads Angular's own
// environment.ts / environment.prod.ts pair — the same fileReplacements
// mechanism this app already uses for `production` everywhere else, rather
// than inventing a second one.
import { environment } from "../../environments/environment";
import { FLARE_URL, FLARE_KEY, FLARE_RELEASE } from "./flare-config";

const TIMEOUT_MS = 2_000;
const MAX_CONTEXT_CHARS = 8_000;

export type FlareKind = "server" | "client" | "job" | "soft";

/**
 * Three independent reasons to do nothing, checked on every call rather than
 * once at import: a missing key, a missing endpoint, or a non-production
 * build. Local dev would otherwise flood the queue with noise the auto-fix
 * runner would then try to fix.
 */
export function flareEnabled(): boolean {
  return Boolean(FLARE_URL) && Boolean(FLARE_KEY) && environment.production === true;
}

/**
 * `context` is the one free-form field, so it is bounded by SERIALIZED length.
 * Over the limit it is dropped and replaced with a marker rather than truncated:
 * a clipped JSON string is unparseable, so a truncated context would be strictly
 * worse than none, and the marker lets triage say "something was discarded"
 * instead of implying the reporter sent nothing.
 */
export function boundContext(context: Record<string, unknown>): Record<string, unknown> | null {
  if (!context || Object.keys(context).length === 0) return null;
  let serialized: string;
  try {
    serialized = JSON.stringify(context);
  } catch {
    return { _flareDiscarded: "context was not serializable" };
  }
  if (typeof serialized !== "string") return { _flareDiscarded: "context was not serializable" };
  if (serialized.length > MAX_CONTEXT_CHARS) {
    return { _flareDiscarded: `context was ${serialized.length} chars, over the ${MAX_CONTEXT_CHARS} limit` };
  }
  return context;
}

export type FlarePayload = {
  kind: FlareKind;
  name: string;
  message: string;
  stack: string | null;
  url: string | null;
  release: string | null;
  environment: "production";
  occurredAt: number;
  context: Record<string, unknown> | null;
};

/**
 * The diagnosis an error carries on itself: a plain-object `params` and up to
 * three links of its `cause` chain (name and message only, never a cause's
 * stack). Ported from flare/reporters/next/lib/flare.ts#errorDetail, which has
 * the full rationale. Both keys are `_`-prefixed so they cannot collide with a
 * caller's context, and the result still passes through `boundContext`.
 */
export function errorDetail(error: Error): Record<string, unknown> {
  const detail: Record<string, unknown> = {};

  const params = (error as Error & { params?: unknown }).params;
  // A plain object only. An array or a scalar `params` is somebody else's field
  // by that name, not a diagnostic payload.
  if (params !== null && typeof params === "object" && !Array.isArray(params)) {
    detail._params = params;
  }

  const chain: Array<{ name: string; message: string }> = [];
  const seen = new Set<unknown>();
  let cause: unknown = (error as Error & { cause?: unknown }).cause;
  while (cause instanceof Error && chain.length < 3 && !seen.has(cause)) {
    seen.add(cause);
    chain.push({ name: cause.name || "Error", message: cause.message || "" });
    cause = (cause as Error & { cause?: unknown }).cause;
  }
  if (chain.length > 0) detail._cause = chain;

  return detail;
}

export function buildPayload(err: unknown, context: Record<string, unknown> = {}): FlarePayload {
  const { kind, url, ...rest } = context;
  const error = err instanceof Error ? err : new Error(typeof err === "string" ? err : "Unknown error");
  return {
    kind: (typeof kind === "string" ? kind : "server") as FlareKind,
    name: error.name || "Error",
    message: error.message || "Unknown error",
    stack: typeof error.stack === "string" ? error.stack : null,
    url: typeof url === "string" ? url : null,
    release: FLARE_RELEASE,
    environment: "production",
    occurredAt: Date.now(),
    context: boundContext({ ...rest, ...errorDetail(error) }),
  };
}

async function send(body: unknown): Promise<void> {
  if (!flareEnabled()) return;
  try {
    await fetch(FLARE_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-flare-key": FLARE_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // Swallowed on purpose. A monitoring library that breaks the app it
    // monitors is worse than no monitoring at all.
  }
}

export async function reportError(err: unknown, context: Record<string, unknown> = {}): Promise<void> {
  try {
    await send(buildPayload(err, context));
  } catch {
    // Unreachable in practice; present so no caller can ever receive a throw.
  }
}

export async function reportSoft(message: string, context: Record<string, unknown> = {}): Promise<void> {
  try {
    await send(buildPayload(new Error(message), { kind: "soft", ...context }));
  } catch {
    // As above.
  }
}
