'use client';

export default function AuthCardLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-full w-full bg-[#070d1d] px-4 py-6 text-[#dae2fd]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-[#0f1530] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-200/80">{eyebrow}</p>
          <h1 className="mt-3 font-['Plus_Jakarta_Sans'] text-3xl font-semibold leading-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-[#ccc3d8]">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
