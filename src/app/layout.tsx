import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppHeader } from '@/components/app-header';
import { Toaster } from '@/components/ui/toaster';
// Removed: import { AI } from '@/app/actions';

export const metadata: Metadata = {
  title: 'Recipe Snap - AI Powered Recipes',
  description: 'Generate recipes from images of your ingredients!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className={`font-sans antialiased flex flex-col min-h-screen`}>
        {/* Removed <AI> wrapper */}
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
          {children}
        </main>
        <Toaster />
        <footer className="py-6 md:px-8 md:py-0 border-t mt-auto">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with <span className="text-primary font-semibold">Ayush's</span> & Kiwi.
            </p>
          </div>
        </footer>
        {/* Removed </AI> wrapper */}
      </body>
    </html>
  );
}
