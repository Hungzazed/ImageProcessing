import React from 'react';

type StatusBannerProps = {
  tone?: 'success' | 'error';
  message?: string;
};

export default function StatusBanner({ tone = 'success', message }: StatusBannerProps) {
  if (!message) return null;

  const className =
    tone === 'error'
      ? 'rounded-xl border border-[#ffb4ab]/20 bg-[#93000a]/20 px-4 py-3 text-sm text-[#ffdad6]'
      : 'rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/10 px-4 py-3 text-sm text-[#eaddff]';

  return <div className={className}>{message}</div>;
}
