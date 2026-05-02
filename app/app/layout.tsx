import { DataProvider } from '@/components/DataProvider';
import { AppShell } from '@/components/AppShell';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 min-h-screen">
      <DataProvider>
        <AppShell>{children}</AppShell>
        <PWAInstallPrompt />
      </DataProvider>
    </div>
  );
}
