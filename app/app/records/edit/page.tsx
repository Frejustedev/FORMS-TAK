'use client';

import { Suspense } from 'react';
import { EditRecordView } from '@/components/EditRecordView';

export default function EditRecordPage() {
  return (
    <Suspense fallback={null}>
      <EditRecordView />
    </Suspense>
  );
}
