'use client';

import {
  Bone,
  LayoutDashboard,
  PlusCircle,
  ShieldAlert,
  Layers,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useData } from './DataProvider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, platform, schema } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Initialisation du registre...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: 'Tableau de bord', href: '/app', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Nouveau dossier', href: '/app/records/new', icon: <PlusCircle className="w-5 h-5" /> },
    { name: 'À compléter', href: '/app/incomplete', icon: <AlertCircle className="w-5 h-5" /> },
    { name: 'Éditer le questionnaire', href: '/app/schema', icon: <Layers className="w-5 h-5" /> },
    { name: 'Administration', href: '/app/admin', icon: <ShieldAlert className="w-5 h-5" /> },
  ];

  const platformLabel: Record<string, string> = {
    electron: 'Windows portable',
    capacitor: 'Mobile',
    memory: 'Navigateur (mémoire)',
    unknown: '—',
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm z-10">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Bone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base text-gray-900 dark:text-gray-100">Registre MO TAK</div>
            <div className="text-[11px] text-gray-500">Métastases osseuses du CDT</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 text-sm font-medium">
          {navLinks.map((item) => {
            const normalized = (pathname || '').replace(/\/$/, '');
            const isActive = normalized === item.href || normalized === item.href + '/';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <div className="text-[11px] text-gray-500 leading-snug">
            Plateforme : <span className="font-semibold">{platformLabel[platform] || platform}</span>
            <br />
            Schéma v{schema?.version} · {schema?.fields.length ?? 0} champs
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <div className="md:hidden flex flex-col w-full h-full">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Bone className="w-5 h-5" />
            </div>
            <span className="font-bold text-base">Registre MO TAK</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen((v) => !v)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {mobileMenuOpen && (
          <div className="absolute top-[65px] left-0 right-0 bottom-0 bg-white dark:bg-gray-900 z-20 flex flex-col">
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2 text-base font-medium">
              {navLinks.map((item) => {
                const normalized = (pathname || '').replace(/\/$/, '');
                const isActive = normalized === item.href || normalized === item.href + '/';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <ThemeToggle />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto w-full relative">{children}</main>
      </div>

      <main className="hidden md:block flex-1 overflow-y-auto w-full relative">{children}</main>
    </div>
  );
}
