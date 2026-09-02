import type { Metadata } from 'next';
import { functionalFont, displayFont } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Esque',
  description: 'Esque — a niche, experimental fashion house.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${functionalFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
