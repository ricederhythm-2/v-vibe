'use client';

import Link from 'next/link';
import { Sparkles, Heart, UserPlus, Mic } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useMyProfile } from '@/hooks/useMyProfile';
import NotificationBell from '@/components/NotificationBell';
import UserMenu from '@/components/UserMenu';

const BRAND = '#EF5285';

export default function AppHeader() {
  const { likedIds }       = useFavorites();
  const { profile }        = useMyProfile();
  const likedCount         = likedIds.size;

  return (
    <header className="w-full flex-shrink-0" style={{ borderBottom: '1px solid #F0F0F0' }}>
      <div className="w-full max-w-[430px] mx-auto flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: BRAND }} />
          <span className="font-black text-xl tracking-tight" style={{ color: '#111111' }}>
            V-Vibe
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/favorites"
            className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all hover:scale-105"
            style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
            aria-label="お気に入り"
          >
            <Heart className="w-3.5 h-3.5" style={{ color: BRAND, fill: BRAND }} />
            <span className="text-xs font-bold" style={{ color: BRAND }}>{likedCount}</span>
            {likedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: BRAND }} />
            )}
          </Link>
          {!profile && (
            <Link
              href="/register"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105"
              style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
              aria-label="Vライバー登録"
            >
              <UserPlus className="w-3.5 h-3.5" style={{ color: '#555555' }} />
            </Link>
          )}
          <Link
            href="/post"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
            aria-label="ボイス投稿"
          >
            <Mic className="w-3.5 h-3.5" style={{ color: '#555555' }} />
          </Link>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
