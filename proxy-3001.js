/**
 * Lightweight HTTP + WebSocket proxy.
 * Listens on 0.0.0.0:3001 and forwards all traffic to localhost:3000.
 *
 * This allows the app to be reached at both:
 *   • http://localhost:3000        (direct)
 *   • http://<network-ip>:3001    (via this proxy, from phones / other devices)
 *   • http://localhost:3001        (also works locally)
 *
 * Uses only Node.js built-in modules — no extra npm packages needed.
 * Handles WebSocket upgrades so Next.js HMR (hot reload) keeps working.
 */

const http = require("http");
const net = require("net");

const TARGET_HOST = "127.0.0.1";
const TARGET_PORT = 3000;
const PROXY_PORT = 3001;

// ── HTTP request proxy ────────────────────────────────────────────────────────

function proxyRequest(req, res) {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`,
    },
  };

  const upstream = http.request(options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    upstreamRes.pipe(res, { end: true });
  });

  upstream.on("error", (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
    }
    res.end(`Proxy error: ${err.message}`);
  });

  req.pipe(upstream, { end: true });
}

// ── WebSocket (HMR / upgrade) proxy ──────────────────────────────────────────

function proxyUpgrade(req, clientSocket, head) {
  const targetSocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    // Re-send the upgrade handshake to the upstream server
    const headerLines = [
      `${req.method} ${req.url} HTTP/${req.httpVersion}`,
      ...Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`),
      "",
      "",
    ];
    targetSocket.write(headerLines.join("\r\n"));
    if (head && head.length) targetSocket.write(head);

    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  targetSocket.on("error", () => { try { clientSocket.destroy(); } catch (_) {} });
  clientSocket.on("error", () => { try { targetSocket.destroy(); } catch (_) {} });
}

// ── Start server ──────────────────────────────────────────────────────────────

const server = http.createServer(proxyRequest);
server.on("upgrade", proxyUpgrade);

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(
    `[proxy-3001] Forwarding  :${PROXY_PORT}  →  localhost:${TARGET_PORT}`
  );
  console.log(`[proxy-3001] App reachable at:`);
  console.log(`  • http://localhost:${PROXY_PORT}`);
  console.log(`  • http://<your-network-ip>:${PROXY_PORT}`);
});

server.on("error", (err) => {
  console.error(`[proxy-3001] Error: ${err.message}`);
  process.exit(1);
});
