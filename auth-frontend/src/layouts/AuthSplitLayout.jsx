import React from 'react';
import AuthHeroPanel from '../components/auth/AuthHeroPanel';

export default function AuthSplitLayout({
    image,
    heroTitle,
    heroSubtitle,
    children,
    topOffsetClass = 'pt-24 md:pt-0',
}) {
    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-[#0b1326] text-[#dae2fd]">
            <header className="fixed left-0 top-0 z-50 flex w-full items-center px-4 py-4 md:px-16 md:py-6">
                <div className="font-['Plus Jakarta Sans'] text-2xl font-bold tracking-[-0.04em] text-[#d2bbff] md:text-3xl">
                    Lumina Studio
                </div>
            </header>

            <main className={`flex flex-1 items-stretch ${topOffsetClass}`}>
                <div className="grid h-full w-full lg:grid-cols-[1.02fr_0.98fr]">
                    <AuthHeroPanel image={image} title={heroTitle} subtitle={heroSubtitle} />

                    <section className="relative flex min-h-0 items-center justify-center overflow-hidden bg-[#0b1326] px-4 py-6 sm:px-8 lg:px-10">
                        <div className="absolute right-[-10%] top-[-10%] h-[360px] w-[360px] rounded-full bg-[#7c3aed]/10 blur-[120px]" />
                        <div className="absolute bottom-[-5%] left-[5%] h-[260px] w-[260px] rounded-full bg-[#4cd7f6]/5 blur-[100px]" />

                        <div className="relative z-10 flex w-full max-w-[440px] flex-col justify-center">
                            {children}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
