import { rm } from 'node:fs/promises';

// SPA routing is configured via assets.not_found_handling in wrangler.jsonc.
await rm(new URL('../dist/_redirects', import.meta.url), {
  force: true,
});
