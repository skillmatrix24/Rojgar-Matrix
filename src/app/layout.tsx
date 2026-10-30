import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LanguageProvider } from '@/lib/i18n';
import { DynamicBranding } from '@/components/layout/DynamicBranding';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { getAdminDb } from '@/lib/firebase-admin';
import Script from 'next/script';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Rojgar Matrix | India\'s Modern AI Job Marketplace',
  description: 'Find verified jobs in Raipur, Bilaspur, Bhilai and across India. Connect directly with employers via WhatsApp. AI-powered resume builder and job matching.',
  keywords: ['Jobs in Raipur', 'WhatsApp Jobs', 'AI Job Match', 'Rojgar Matrix', 'Hiring in Chhattisgarh', 'Resume Builder'],
  authors: [{ name: 'Skill Matrix' }],
  metadataBase: new URL('https://rojgarmatrix.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Rojgar Matrix | India\'s Modern AI Job Marketplace',
    description: 'Get hired directly on WhatsApp. Precision matching for blue-collar and white-collar roles.',
    url: 'https://rojgarmatrix.com',
    siteName: 'Rojgar Matrix',
    locale: 'en_IN',
    type: 'website',
  },
};

/**
 * Server-side check for AdSense global toggle.
 */
async function getAdSettings() {
  try {
    const snap = await getAdminDb().doc("settings/ads").get();
    return snap.exists ? snap.data() : { isActive: true, publisherId: "ca-pub-3756451089935740" };
  } catch (e) {
    console.error("Failed to load ad settings on layout:", e);
    return { isActive: true, publisherId: "ca-pub-3756451089935740" };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adSettings = await getAdSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Mukta:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
        
        {/* Google AdSense Script - High reliability for verification */}
        {(adSettings?.isActive !== false) && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSettings?.publisherId || "ca-pub-3756451089935740"}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="font-mukta antialiased">
        <LanguageProvider>
          <FirebaseClientProvider>
            <DynamicBranding />
            {children}
            <CookieConsent />
            <Toaster />
          </FirebaseClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}