import type { ReactNode } from 'react';

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="flex-1 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-4xl flex flex-col">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
            {title}
          </h1>
          <p className="text-neutral-400 text-lg">
            {description}
          </p>
        </div>

        <div className="w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
