/**
 * Creates deploy/certs/key.pem + cert.pem (self-signed, SAN for localhost)
 * if they are missing. Uses OpenSSL (Git for Windows ships one).
 */
const { existsSync } = require("fs");
const { join } = require("path");
const { spawnSync } = require("child_process");

const root = join(__dirname, "..");
const certsDir = join(root, "deploy", "certs");
const keyPath = join(certsDir, "key.pem");
const certPath = join(certsDir, "cert.pem");
const cnfPath = join(certsDir, "openssl-local.cnf");

function findOpenssl() {
  if (process.env.OPENSSL_BIN && existsSync(process.env.OPENSSL_BIN)) {
    return process.env.OPENSSL_BIN;
  }
  if (process.platform === "win32") {
    const gitOpenssl = "C:\\Program Files\\Git\\usr\\bin\\openssl.exe";
    if (existsSync(gitOpenssl)) return gitOpenssl;
  }
  return "openssl";
}

function main() {
  if (existsSync(keyPath) && existsSync(certPath)) {
    console.log("[certs] Already present:", certPath);
    return;
  }
  if (!existsSync(cnfPath)) {
    console.error("[certs] Missing config:", cnfPath);
    process.exit(1);
  }
  const openssl = findOpenssl();
  const r = spawnSync(
    openssl,
    [
      "req",
      "-x509",
      "-nodes",
      "-newkey",
      "rsa:2048",
      "-keyout",
      keyPath,
      "-out",
      certPath,
      "-days",
      "825",
      "-config",
      cnfPath,
    ],
    { stdio: "inherit", cwd: root }
  );
  if (r.status !== 0) {
    console.error(
      "[certs] OpenSSL failed. Install OpenSSL or set OPENSSL_BIN to openssl.exe (Git includes one)."
    );
    process.exit(r.status || 1);
  }
  console.log("[certs] Wrote", keyPath, "and", certPath);
}

main();
