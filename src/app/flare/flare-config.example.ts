// Template only — this file is never imported by app code. It shows the
// shape that `node scripts/gen-flare-env.mjs` writes to the gitignored
// src/app/flare/flare-config.ts, generated from the FLARE_URL, FLARE_KEY and
// COMMIT_REF environment variables (COMMIT_REF is set automatically by
// Netlify; the other two are set in the Netlify dashboard's production
// environment variables). Copy this file to flare-config.ts for local
// development, or just run the generator — it produces this exact
// empty-string shape when no env vars are set:
//   node scripts/gen-flare-env.mjs

export const FLARE_URL: string = "";
export const FLARE_KEY: string = "";
export const FLARE_RELEASE: string | null = null;
