import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_access_token')?.value;

  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/auth/login');
  }

  // Fallback (unreachable due to redirect)
  return null;
}
