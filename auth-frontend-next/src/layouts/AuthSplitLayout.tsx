'use client';

import AuthHeroPanel from '@/components/auth/AuthHeroPanel';

export default function AuthSplitLayout({
  image,
  heroTitle,
  heroSubtitle,
  children,
}: {
  image?: string;
  heroTitle: string;
  heroSubtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] w-full overflow-hidden overflow-x-hidden bg-[#0b1326] text-[#dae2fd]">
      <main className="flex min-h-[100dvh] flex-1 items-stretch">
        <div className="grid min-h-[100dvh] h-[100dvh] w-full lg:grid-cols-2">
          <AuthHeroPanel image={image} title={heroTitle} subtitle={heroSubtitle} />

          <section className="relative flex min-h-0 items-center justify-center overflow-hidden bg-[#0b1326] px-4 py-2 sm:px-8 lg:px-10">
            <div className="absolute right-[-6%] top-[-12%] h-[260px] w-[260px] rounded-full bg-[#7c3aed]/10 blur-[120px] md:h-[320px] md:w-[320px]" />
            <div className="absolute bottom-[-10%] left-[5%] h-[180px] w-[180px] rounded-full bg-[#4cd7f6]/5 blur-[90px] md:h-[220px] md:w-[220px]" />

            <div className="relative z-10 flex w-full max-w-[420px] flex-col justify-center py-0">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}
