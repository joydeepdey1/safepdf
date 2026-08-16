import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col font-sans">
      <header className="border-b border-neutral-800 bg-neutral-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold">P</div>
          <span className="text-xl font-bold tracking-tight">PaperVault</span>
        </div>
        <nav className="flex gap-4 text-sm font-medium text-neutral-400">
          <a href="#" className="hover:text-white transition-colors">PDF Tools</a>
          <a href="#" className="hover:text-white transition-colors">Image Tools</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-800 bg-neutral-950 py-8 px-6 text-center text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} PaperVault. All processing happens entirely in your browser.</p>
      </footer>
    </div>
  );
}
