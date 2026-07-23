import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { defaultDescription, defaultKeywords, siteName, siteUrl } from '@/lib/metadata';

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
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: 'Scout — Every Meaningful Opportunity for Women',
    template: '%s | Scout',
  },
  description: defaultDescription,
  keywords: defaultKeywords,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName,
    title: 'Scout — Every Meaningful Opportunity for Women',
    description: defaultDescription,
    images: [{ url: '/og/og-default.png', width: 1200, height: 630, alt: 'Scout' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scout — Every Meaningful Opportunity for Women',
    description: defaultDescription,
    images: ['/og/og-default.png'],
  },
  icons: {
    icon: [
      { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicons/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/favicons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/favicons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: siteName, statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#174C44',
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${newsreader.variable}`}>
      <body className="antialiased font-sans">
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
