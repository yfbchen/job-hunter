import type { ReactNode } from "react";
import type { Page } from "../types";

interface LayoutProps {
  children: ReactNode;
  page: Page;
  onNav: (p: Page) => void;
}

export function Layout({ children, page, onNav }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            Job Hunter
          </h1>
          <nav className="flex gap-1">
            <button
              onClick={() => onNav("dashboard")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                page === "dashboard"
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => onNav("artifacts")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                page === "artifacts"
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Artifacts
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
