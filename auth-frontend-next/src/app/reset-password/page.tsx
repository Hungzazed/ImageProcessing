import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

export default function Page({ searchParams }: { searchParams: { email?: string; token?: string } }) {
  return <ResetPasswordPage searchParams={searchParams} />;
}
