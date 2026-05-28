import { Suspense } from 'react';
import { VerifyOtpPage } from '@/pages/VerifyOtpPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpPage />
    </Suspense>
  );
}
