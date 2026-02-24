'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * ヘッダーに表示するユーザーメニュー。
 * - 未ログイン: ログインボタン
 * - ログイン済: アバター画像 + タップでサインアウト
 */
export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // 認証状態変化をリッスン
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  };

  // ローディング中・未ログインは何も表示しない（ログインは投稿時に自然に促す）
  if (loading || !user) return null;

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? user.email?.split('@')[0]
    ?? 'ユーザー';
  const initial = displayName[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="w-8 h-8 rounded-full overflow-hidden transition-all hover:scale-110 focus:outline-none"
        style={{ border: '1.5px solid rgba(196,181,253,0.35)' }}
        aria-label="ユーザーメニュー"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
          >
            {initial}
          </div>
        )}
      </button>

      {menuOpen && (
        <>
          {/* オーバーレイ（クリックで閉じる） */}
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />

          {/* ドロップダウン */}
          <div
            className="absolute right-0 top-10 z-20 w-44 rounded-2xl py-1 overflow-hidden"
            style={{
              background: 'rgba(22,9,58,0.95)',
              border: '1px solid rgba(196,181,253,0.18)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="px-4 py-2.5 border-b"
              style={{ borderColor: 'rgba(196,181,253,0.1)' }}
            >
              <p className="text-xs font-bold truncate" style={{ color: '#faf5ff' }}>
                {displayName}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(196,181,253,0.4)' }}>
                {user.email}
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-all hover:bg-violet-900/30"
              style={{ color: 'rgba(253,164,175,0.8)' }}
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
