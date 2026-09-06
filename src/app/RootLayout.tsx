import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, Lock } from 'lucide-react';

export default function RootLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1 outline-none"
            aria-label="PaperVault Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm group-hover:scale-105 transition-transform">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-neutral-200 transition-colors">
              PaperVault
            </span>
          </Link>

          {!isHome && (
            <Link
              to="/#tools"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tools</span>
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-5 text-sm font-medium text-neutral-400">
          <Link
            to="/#tools"
            className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 outline-none"
          >
            Tools
          </Link>
          <Link
            to="/#privacy"
            className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 outline-none"
          >
            Privacy
          </Link>
          <a
            href="https://github.com/joydeepdey1/safepdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors p-1 focus-visible:ring-2 focus-visible:ring-blue-500 rounded outline-none"
            aria-label="GitHub Repository"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-10 px-6 text-sm text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>100% Client-Side • No Files Stored or Transmitted</span>
          </div>
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} PaperVault. Free, open-source & offline-first.
          </p>
        </div>
      </footer>
    </div>
  );
}
