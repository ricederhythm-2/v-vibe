'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, LogOut, Mic, Pencil, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMyProfile } from '@/hooks/useMyProfile';
import type { User } from '@supabase/supabase-js';

const BRAND = '#EF5285';

export default function UserMenu() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router   = useRouter();
  const { profile } = useMyProfile();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  };

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105"
        style={{ background: BRAND, color: '#FFFFFF', boxShadow: `0 2px 8px ${BRAND}40` }}
      >
        <LogIn className="w-3.5 h-3.5" />
        ログイン
      </Link>
    );
  }

  const avatarUrl   = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? user.email?.split('@')[0]
    ?? 'ユーザー';
  const initial = displayName[0].toUpperCase();

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="w-8 h-8 rounded-full overflow-hidden transition-all hover:scale-110 focus:outline-none"
        style={{ border: `1.5px solid ${BRAND}` }}
        aria-label="ユーザーメニュー"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs font-black text-white"
            style={{ background: BRAND }}
          >
            {initial}
          </div>
        )}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-0 top-10 z-20 w-44 rounded-2xl py-1 overflow-hidden"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E8E8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #F0F0F0' }}>
              <p className="text-xs font-bold truncate" style={{ color: '#111111' }}>{displayName}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#AAAAAA' }}>{user.email}</p>
            </div>

            {profile && (
              <Link
                href="/my-posts"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-all hover:bg-gray-50"
                style={{ color: '#555555' }}
              >
                <Mic className="w-3.5 h-3.5" />
                投稿管理
              </Link>
            )}
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-all hover:bg-gray-50"
              style={{ color: '#555555' }}
            >
              {profile ? <Pencil className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {profile ? 'プロフィール編集' : 'Vライバー登録'}
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-all hover:bg-gray-50"
              style={{ color: '#555555', borderTop: '1px solid #F0F0F0' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  );
}
