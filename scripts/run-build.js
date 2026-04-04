/**
 * Cloudflare Workers Builds sets WORKERS_CI=1 during the dashboard "build" step.
 * OpenNext must run there so `.open-next/` exists before `npx wrangler deploy`.
 * Locally and in Docker, we keep a normal `next build`.
 */
const { execSync } = require("child_process");

if (process.env.WORKERS_CI === "1") {
  console.log("[build] WORKERS_CI=1 → opennextjs-cloudflare build");
  execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
} else {
  execSync("npx next build", { stdio: "inherit" });
}
