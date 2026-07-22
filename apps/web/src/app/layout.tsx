import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-context';

const geist = localFont({
  src: [
    {
      path: '../../public/Fonts/Geist/Geist-VariableFont_wght.ttf',
      style: 'normal',
    },
    {
      path: '../../public/Fonts/Geist/Geist-Italic-VariableFont_wght.ttf',
      style: 'italic',
    },
  ],
  variable: '--font-sans',
});

const newsreader = localFont({
  src: [
    {
      path: '../../public/Fonts/Newsreader/Newsreader-VariableFont_opsz,wght.ttf',
      style: 'normal',
    },
    {
      path: '../../public/Fonts/Newsreader/Newsreader-Italic-VariableFont_opsz,wght.ttf',
      style: 'italic',
    },
  ],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Scout | Opportunity Intelligence',
  description: 'AI-powered opportunity intelligence platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${newsreader.variable}`}>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
