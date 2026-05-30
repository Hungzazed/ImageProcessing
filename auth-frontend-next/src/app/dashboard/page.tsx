import { redirect } from 'next/navigation';

export default function Page() {
  const shellBaseUrl = (process.env.NEXT_PUBLIC_SHELL_APP_URL || '').replace(/\/+$/, '');
  if (!shellBaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SHELL_APP_URL');
  }
  redirect(`${shellBaseUrl}/dashboard`);
}
