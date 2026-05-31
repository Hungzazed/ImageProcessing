const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isLocalhostUrl = (value: string) => {
  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const isBrowserOnLocalhost = () => {
  if (typeof window === 'undefined') return false;

  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export function getShellBaseUrl() {
  const configuredUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_SHELL_APP_URL || '');

  if (configuredUrl && (!isLocalhostUrl(configuredUrl) || isBrowserOnLocalhost())) {
    return configuredUrl;
  }

  if (typeof document !== 'undefined' && document.referrer) {
    try {
      return new URL(document.referrer).origin;
    } catch {
      // Fall through to the current origin.
    }
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return configuredUrl;
}

export function getShellDashboardUrl() {
  const shellBaseUrl = getShellBaseUrl();

  return shellBaseUrl ? `${shellBaseUrl}/dashboard` : '';
}
