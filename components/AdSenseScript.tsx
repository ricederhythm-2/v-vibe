'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

// 広告を表示しないページ（コンテンツがない・アクション専用画面）
const NO_ADS_PATHS = ['/login', '/register'];

export default function AdSenseScript() {
  const pathname = usePathname();
  if (NO_ADS_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2902941311970353"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
