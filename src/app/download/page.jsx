import Link from "next/link";
import { Download, Terminal, ArrowLeft, FileCode, Smartphone } from "lucide-react";

export const metadata = {
  title: "Downloads | FleetShare",
  description:
    "FleetShare Android APK, Docker server install scripts, and optional AI driving-licence validator.",
};

const AI_VALIDATOR_REPO = "https://github.com/dan123-tech/AI_driving-licence";

const COMMANDS = `# Linux / macOS (from repo root)
./install.sh

# FleetShare + AI driving-licence validator (Gemini, port 8080; cloned beside this project):
./install.sh --ai-validator

# Or manual equivalent:
docker compose build --no-cache app
docker compose up -d

# Other flags: ./install.sh --help
# Stop stack:  ./install.sh --down
# Windows:     .\\install.ps1   (-Down -NoBuild -Pull -AiValidator -Help)`;

export default function DownloadPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--main-bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[var(--primary)] mb-8"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to home
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">Downloads</h1>
        <p className="text-slate-600 text-sm sm:text-base mb-8 leading-relaxed">
          Android app package, self-hosted server installers (Docker), and optional AI validator scripts.
        </p>

        <section id="android" className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4" aria-hidden />
            Android app
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-3">
            The link below is a <strong>direct file download</strong>, not a separate HTML page. When the APK is deployed on
            your server, the same URL works with your domain, for example{" "}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded break-all">
              https://companyfleetshare.com/downloads/fleetshare.apk
            </code>
            .
          </p>
          <ul className="space-y-3">
            <li>
              <a
                href="/downloads/fleetshare.apk"
                download="fleetshare.apk"
                className="flex items-center justify-between gap-4 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[var(--primary)] hover:bg-slate-50/80 transition-colors text-left"
              >
                <span className="font-semibold text-slate-800">FleetShare for Android</span>
                <span className="text-xs font-mono text-slate-500 shrink-0">.apk</span>
              </a>
              <p className="text-xs text-slate-500 mt-1.5 ml-1">
                Build the app from your Android project, then place the file at{" "}
                <code className="bg-slate-100 px-1 rounded">public/downloads/fleetshare.apk</code> before deploy, or upload it
                to that path on the host. <code className="bg-slate-100 px-1 rounded">*.apk</code> is gitignored by default so
                the binary is not committed; add it on the server or in your release pipeline. If the file is missing, this
                link returns 404 until you publish the APK.
              </p>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" aria-hidden />
            Server (Docker)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Install{" "}
            <a
              href="https://docs.docker.com/get-docker/"
              className="text-[var(--primary)] font-semibold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docker
            </a>{" "}
            on your server, copy the FleetShare project (with <code className="bg-slate-100 px-1 rounded">docker-compose.yml</code>),
            then run the scripts below.
          </p>
          <ul className="space-y-3">
            <li>
              <a
                href="/downloads/fleetshare-docker-install.sh"
                download="fleetshare-docker-install.sh"
                className="flex items-center justify-between gap-4 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[var(--primary)] hover:bg-slate-50/80 transition-colors text-left"
              >
                <span className="font-semibold text-slate-800">Linux / macOS installer</span>
                <span className="text-xs font-mono text-slate-500 shrink-0">.sh</span>
              </a>
              <p className="text-xs text-slate-500 mt-1.5 ml-1">
                Save into the project folder →{" "}
                <code className="bg-slate-100 px-1 rounded">chmod +x fleetshare-docker-install.sh && ./fleetshare-docker-install.sh</code>
                {" "}— flags: <code className="bg-slate-100 px-1 rounded">--down</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">--no-build</code>, <code className="bg-slate-100 px-1 rounded">--pull</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">--ai-validator</code> (see below)
              </p>
            </li>
            <li>
              <a
                href="/downloads/fleetshare-install.ps1"
                download="fleetshare-install.ps1"
                className="flex items-center justify-between gap-4 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[var(--primary)] hover:bg-slate-50/80 transition-colors text-left"
              >
                <span className="font-semibold text-slate-800">Windows PowerShell installer</span>
                <span className="text-xs font-mono text-slate-500 shrink-0">.ps1</span>
              </a>
              <p className="text-xs text-slate-500 mt-1.5 ml-1">
                Save into the project folder →{" "}
                <code className="bg-slate-100 px-1 rounded">.\fleetshare-install.ps1</code>
                {" "}— optional: <code className="bg-slate-100 px-1 rounded">-Down</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">-NoBuild</code>, <code className="bg-slate-100 px-1 rounded">-AiValidator</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">-Help</code>
              </p>
            </li>
            <li>
              <a
                href="/downloads/fleetshare-docker-commands.txt"
                download="fleetshare-docker-commands.txt"
                className="flex items-center justify-between gap-4 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[var(--primary)] hover:bg-slate-50/80 transition-colors text-left"
              >
                <span className="font-semibold text-slate-800">Commands only (text file)</span>
                <span className="text-xs font-mono text-slate-500 shrink-0">.txt</span>
              </a>
            </li>
          </ul>
        </section>

        <section id="ai-validator" className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            AI driving-licence validator (optional)
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-3">
            FleetShare can check uploaded licence photos with an external{" "}
            <strong>Gemini</strong> microservice (same API the main app expects on port{" "}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">8080</code>
            ). The reference implementation lives here:
          </p>
          <a
            href={AI_VALIDATOR_REPO}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline mb-5"
            target="_blank"
            rel="noopener noreferrer"
          >
            {AI_VALIDATOR_REPO.replace("https://", "")}
          </a>

          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" aria-hidden />
            Download (validator only)
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Use these if you only need the licence-check service, or grab them alongside the FleetShare installers above.
            You still need Docker and <code className="bg-slate-100 px-1 rounded">git</code> on the machine.
          </p>
          <ul className="space-y-3 mb-6">
            <li>
              <a
                href="/downloads/fleetshare-ai-validator-install.sh"
                download="fleetshare-ai-validator-install.sh"
                className="flex items-center justify-between gap-4 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[var(--primary)] hover:bg-slate-50/80 transition-colors text-left"
              >
                <span className="font-semibold text-slate-800">AI validator — Linux / macOS</span>
                <span className="text-xs font-mono text-slate-500 shrink-0">.sh</span>
              </a>
              <p className="text-xs text-slate-500 mt-1.5 ml-1">
                <code className="bg-slate-100 px-1 rounded">chmod +x fleetshare-ai-validator-install.sh && ./fleetshare-ai-validator-install.sh</code>
                {" "}— optional: <code className="bg-slate-100 px-1 rounded">..</code> as first argument to create{" "}
                <code className="bg-slate-100 px-1 rounded">AI_driving-licence</code> next to your current folder (e.g. beside FleetShare).
              </p>
            </li>
            <li>
              <a
                href="/downloads/fleetshare-ai-validator-install.ps1"
                download="fleetshare-ai-validator-install.ps1"
                className="flex items-center justify-between gap-4 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[var(--primary)] hover:bg-slate-50/80 transition-colors text-left"
              >
                <span className="font-semibold text-slate-800">AI validator — Windows PowerShell</span>
                <span className="text-xs font-mono text-slate-500 shrink-0">.ps1</span>
              </a>
              <p className="text-xs text-slate-500 mt-1.5 ml-1">
                <code className="bg-slate-100 px-1 rounded">.\fleetshare-ai-validator-install.ps1</code>
                {" "}— optional: <code className="bg-slate-100 px-1 rounded">-Parent ..</code> for a sibling folder.
              </p>
            </li>
            <li>
              <a
                href="/downloads/fleetshare-ai-validator-commands.txt"
                download="fleetshare-ai-validator-commands.txt"
                className="flex items-center justify-between gap-4 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[var(--primary)] hover:bg-slate-50/80 transition-colors text-left"
              >
                <span className="font-semibold text-slate-800">AI validator — commands only</span>
                <span className="text-xs font-mono text-slate-500 shrink-0">.txt</span>
              </a>
            </li>
          </ul>

          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 mb-4">
            <li>
              <strong>Installer:</strong> add{" "}
              <code className="bg-slate-100 px-1 rounded text-xs">--ai-validator</code> (bash) or{" "}
              <code className="bg-slate-100 px-1 rounded text-xs">-AiValidator</code> (PowerShell) after the main install.
              Requires <code className="text-xs bg-slate-100 px-1 rounded">git</code>. The script clones the repo into a{" "}
              <strong>sibling</strong> folder <code className="text-xs bg-slate-100 px-1 rounded">AI_driving-licence</code>{" "}
              and runs <code className="text-xs bg-slate-100 px-1 rounded">docker compose up -d --build</code> there.
            </li>
            <li>
              <strong>API key:</strong> create <code className="text-xs bg-slate-100 px-1 rounded">.env</code> in that
              project with <code className="text-xs bg-slate-100 px-1 rounded">GEMINI_API_KEY</code> (see the repo README).
            </li>
            <li>
              <strong>FleetShare Docker</strong> already points the app container at{" "}
              <code className="text-xs bg-slate-100 px-1 rounded">host.docker.internal:8080</code> for licence checks when
              you do not use a per-company Gemini key in the dashboard.
            </li>
            <li>
              <strong>Alternative:</strong> skip this service and set a Gemini API key only under{" "}
              <em>Admin → Company</em> in FleetShare.
            </li>
          </ul>
          <p className="text-xs text-slate-500">
            Health check:{" "}
            <code className="bg-slate-100 text-slate-700 px-1 rounded">curl http://localhost:8080/health</code>
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4" aria-hidden />
            Copy-paste commands
          </h2>
          <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap break-all">{COMMANDS}</pre>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-start gap-2">
            <FileCode className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            Create a <code className="bg-slate-100 text-slate-700 px-1 rounded">.env</code> file (see{" "}
            <code className="bg-slate-100 text-slate-700 px-1 rounded">.env.example</code> in the repo) with at least{" "}
            <strong>AUTH_SECRET</strong> (32+ characters) before starting.
          </p>
        </section>
      </div>
    </div>
  );
}
