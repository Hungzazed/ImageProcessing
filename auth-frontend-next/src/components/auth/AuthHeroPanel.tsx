'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AuthHeroPanel({
  image,
  title,
  subtitle,
}: {
  image?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative hidden overflow-hidden lg:block">
      {image ? (
        <Image src={image} alt="Auth illustration" fill priority className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(140,92,255,0.32),transparent_26%),radial-gradient(circle_at_85%_18%,rgba(79,70,229,0.22),transparent_22%),linear-gradient(180deg,#11182e_0%,#0c1224_48%,#060b16_100%)]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,20,0.18)_0%,rgba(3,8,20,0.55)_42%,rgba(3,8,20,0.9)_100%)]" />

      <div className="relative flex h-full flex-col justify-between p-6 lg:p-8 xl:p-10">
        <div className="flex items-center justify-start">
          <Link href="/login" className="text-[2rem] font-black tracking-[-0.04em] text-white">

          </Link>
        </div>

        <div className="max-w-[420px] pb-4 lg:pb-6">
          <h2 className="text-[clamp(1.5rem,4.5vw,2.8rem)] font-extrabold leading-[0.95] tracking-[-0.05em] text-[#d2bbff]">{title}</h2>
          <p className="mt-2 max-w-md text-xs md:text-sm leading-6 text-white/75">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}
