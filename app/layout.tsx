import type { Metadata } from 'next';
import { functionalFont, displayFont } from '@/lib/fonts';
import { ShellClient } from '@/components/navigation/ShellClient';
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
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-esque-forest focus:px-4 focus:py-2 focus:text-esque-text"
        >
          Skip to content
        </a>
        <ShellClient>{children}</ShellClient>
      </body>
    </html>
  );
}
