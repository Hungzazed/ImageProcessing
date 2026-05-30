import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

type ResetPasswordSearchParams = {
  email?: string;
  token?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ResetPasswordSearchParams>;
}) {
  return <ResetPasswordPage searchParams={await searchParams} />;
}
