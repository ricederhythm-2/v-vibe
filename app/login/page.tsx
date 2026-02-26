'use client';

import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Suspense } from 'react';

const BRAND = '#EF5285';

function LoginForm() {
  const searchParams = useSearchParams();
  const next  = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'x',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { force_login: 'true' },
      },
    });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: '#FFFFFF' }}>
      <div
        className="w-full max-w-xs rounded-3xl p-8 flex flex-col items-center gap-7"
        style={{ border: '1px solid #E8E8E8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        {/* ロゴ */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${BRAND}15`, border: `1px solid ${BRAND}25` }}
          >
            <Sparkles className="w-7 h-7" style={{ color: BRAND }} />
          </div>
          <span className="font-black text-2xl tracking-tight" style={{ color: '#111111' }}>
            V-Vibe
          </span>
          <p className="text-xs text-center" style={{ color: '#AAAAAA' }}>
            X アカウントでかんたんにはじめよう
          </p>
        </div>

        {error && (
          <p
            className="w-full text-center text-xs rounded-xl py-2 px-3"
            style={{ background: '#FFF0F3', border: `1px solid ${BRAND}30`, color: BRAND }}
          >
            認証に失敗しました。もう一度お試しください。
          </p>
        )}

        <div className="w-full">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: '#000000', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X でログイン
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: '#AAAAAA' }}>
          ログインすることで利用規約と<br />プライバシーポリシーに同意したとみなします
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
