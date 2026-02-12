import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-lg text-[#1abc9c]">Company Car Sharing</span>
          <nav className="flex gap-4">
            <Link href="/login" className="text-sm text-white/80 hover:text-[#1abc9c] transition-colors">
              Login
            </Link>
            <Link href="/register" className="text-sm text-white/80 hover:text-[#1abc9c] transition-colors">
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Share company cars.
          <br />
          <span className="text-[#1abc9c]">Simple and clear.</span>
        </h1>
        <p className="text-lg text-white/70 max-w-xl mb-12">
          Reserve vehicles, manage your fleet, and keep everything in one place for your team.
        </p>

        {/* Action card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 max-w-md">
          <h2 className="text-xl font-semibold text-white mb-2">Get started</h2>
          <p className="text-sm text-white/60 mb-6">
            Log in or create an account to access the dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-xl bg-[#1abc9c] text-white font-semibold hover:bg-[#16a085] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-xl text-white/70 text-sm font-medium hover:text-[#1abc9c] transition-colors"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>

        <p className="mt-8 text-sm text-white/50">
          <Link href="/api-docs" className="text-[#1abc9c]/90 hover:underline">
            API documentation (Swagger)
          </Link>
        </p>
      </main>
    </div>
  );
}
