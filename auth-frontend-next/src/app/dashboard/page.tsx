'use client';

import { useEffect } from 'react';
import { getShellDashboardUrl } from '@/utils/shellUrl';

export default function Page() {
  useEffect(() => {
    const dashboardUrl = getShellDashboardUrl();

    if (dashboardUrl) {
      window.location.replace(dashboardUrl);
    }
  }, []);

  return null;
}
