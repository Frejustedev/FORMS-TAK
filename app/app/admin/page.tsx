'use client';

import { AdminPanel } from '@/components/AdminPanel';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  return (
    <div className="flex-1 w-full animate-in fade-in duration-500">
      <AdminPanel onClose={() => router.push('/app')} />
    </div>
  );
}
