import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * File must be `open-next.config.ts` (hyphen) — that is what `opennextjs-cloudflare` discovers.
 *
 * There is no `defineConfig` / `serverExternal` on `@opennextjs/cloudflare` v1.x; use
 * `defineCloudflareConfig` here and list server-only packages in `next.config.mjs` as
 * `serverExternalPackages` (e.g. `jose` for JWT on Cloudflare Workers).
 */
export default {
  ...defineCloudflareConfig(),
  buildCommand: "npx next build --webpack",
};
