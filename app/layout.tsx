import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import PreventPullToRefresh from "@/components/PreventPullToRefresh";
import AdSenseScript from "@/components/AdSenseScript";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ProfileProvider } from "@/context/ProfileContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "OshiVox — 運命の声に出会う場所",
  description: "3秒聴いて、スワイプ。Vライバー・VTuberのファンマッチングアプリ。",
  other: {
    'google-adsense-account': 'ca-pub-2902941311970353',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AdSenseScript />
        <ProfileProvider>
        <FavoritesProvider>
          <PreventPullToRefresh />
          <PageTransition>{children}</PageTransition>
        </FavoritesProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
