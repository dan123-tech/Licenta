/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Hide the floating Next.js dev tools badge (e.g. “N” in the corner) in development */
  devIndicators: false,
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
