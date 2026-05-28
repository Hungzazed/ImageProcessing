export type SharedUser = {
  id: string;
  name: string;
  email: string;
};

function readCookie(name: string) {
  if (typeof document === 'undefined') return null;

  const entry = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!entry) return null;

  return entry.slice(name.length + 1);
}

function parseUser(rawUser: string | null): SharedUser | null {
  if (!rawUser) return null;

  try {
    const decoded = decodeURIComponent(rawUser);
    const parsed = JSON.parse(decoded);

    return {
      id: parsed.id || parsed._id || parsed.userId || 'user-999',
      name: parsed.name || parsed.username || parsed.fullName || 'Creative Creator',
      email: parsed.email || 'creator@lumina.studio',
    };
  } catch {
    return null;
  }
}

export function getSharedSession() {
  if (typeof window === 'undefined') {
    return { accessToken: null as string | null, user: null as SharedUser | null };
  }

  const accessToken =
    readCookie('authToken') ||
    readCookie('auth_access_token') ||
    window.localStorage.getItem('authToken') ||
    window.localStorage.getItem('auth_access_token');

  const rawUser =
    readCookie('authUser') ||
    readCookie('auth_user') ||
    window.localStorage.getItem('authUser') ||
    window.localStorage.getItem('auth_user');

  return {
    accessToken,
    user: parseUser(rawUser),
  };
}