'use client';

import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Suspense } from 'react';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');

  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'x',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      {/* グロー装飾 */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(139,92,246,0.18) 0%, transparent 70%)',
        }}
      />

      {/* カード */}
      <div
        className="w-full max-w-xs rounded-3xl p-8 flex flex-col items-center gap-7"
        style={{
          background: 'rgba(196,181,253,0.05)',
          border: '1px solid rgba(196,181,253,0.14)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 40px rgba(109,40,217,0.18)',
        }}
      >
        {/* ロゴ */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed55, #ec489955)',
              border: '1px solid rgba(196,181,253,0.2)',
            }}
          >
            <Sparkles className="w-7 h-7 text-fuchsia-300" />
          </div>
          <span
            className="font-black text-2xl tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #c4b5fd, #f0abfc, #fda4af)' }}
          >
            V-Vibe
          </span>
          <p className="text-xs text-center" style={{ color: 'rgba(196,181,253,0.5)' }}>
            X アカウントでかんたんにはじめよう
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <p
            className="w-full text-center text-xs rounded-xl py-2 px-3"
            style={{
              background: 'rgba(244,114,182,0.1)',
              border: '1px solid rgba(244,114,182,0.2)',
              color: 'rgba(253,164,175,0.8)',
            }}
          >
            認証に失敗しました。もう一度お試しください。
          </p>
        )}

        {/* X ログインボタン */}
        <div className="w-full">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: '#000',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              color: '#fff',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X でログイン
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: 'rgba(196,181,253,0.3)' }}>
          ログインすることで利用規約と
          <br />
          プライバシーポリシーに同意したとみなします
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
