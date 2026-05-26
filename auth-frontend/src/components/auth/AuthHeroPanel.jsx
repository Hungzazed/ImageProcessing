import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthHeroPanel({ image, title, subtitle, logoTo = '/login' }) {
    return (
        <section className="relative hidden overflow-hidden lg:block">
            <img alt="Auth hero" className="absolute inset-0 h-full w-full object-cover" src={image} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b1326]/90 via-[#0b1326]/45 to-transparent" />

            <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
                <div className="flex items-center justify-start">
                    <Link
                        className="font-['Plus Jakarta Sans'] text-[2rem] font-bold tracking-[-0.04em] text-[#d2bbff]"
                        to={logoTo}
                    >
                        Lumina Studio
                    </Link>
                </div>

                <div className="max-w-[460px] pb-10">
                    <h2 className="font-['Plus Jakarta Sans'] text-[3.65rem] font-extrabold leading-[0.95] tracking-[-0.05em] text-[#d2bbff]">
                        {title}
                    </h2>
                    <p className="mt-4 text-[15px] leading-7 text-white/75">{subtitle}</p>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
                    © 2024 Lumina Studio. Precision in every pixel.
                </div>
            </div>
        </section>
    );
}
