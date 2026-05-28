import { Suspense } from 'react';
import { CallbackPage } from '@/pages/CallbackPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CallbackPage />
    </Suspense>
  );
}
