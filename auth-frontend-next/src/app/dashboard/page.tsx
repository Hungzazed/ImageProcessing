import { redirect } from 'next/navigation';

export default function Page() {
  const shellBaseUrl = (process.env.NEXT_PUBLIC_SHELL_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  redirect(`${shellBaseUrl}/dashboard`);
}
