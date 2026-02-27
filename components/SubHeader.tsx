'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import UserMenu from '@/components/UserMenu';

export default function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="w-full" style={{ borderBottom: '1px solid #F0F0F0' }}>
      <div className="max-w-[430px] mx-auto flex items-center gap-3 px-5 pt-5 pb-4">
        <Link
          href="/"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
          style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
          aria-label="戻る"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: '#555555' }} />
        </Link>

        <div className="flex-1 min-w-0">
          {children}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
