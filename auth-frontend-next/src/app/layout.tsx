import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/components/providers/Providers';

export const metadata: Metadata = {
  title: 'Lumina Studio',
  description: 'Auth frontend built with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
