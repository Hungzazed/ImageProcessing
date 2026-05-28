import { Suspense } from 'react';
import { LoginPage } from '@/pages/LoginPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
