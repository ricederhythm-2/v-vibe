import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RegisterForm from '@/components/RegisterForm';

export const metadata = {
  title: 'Vライバー登録 | V-Vibe',
};

export default function RegisterPage() {
  return (
    <div className="min-h-dvh">
      <header className="w-full max-w-sm mx-auto flex items-center gap-3 px-5 pt-5 pb-3">
        <Link
          href="/"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: 'rgba(196,181,253,0.08)',
            border: '1px solid rgba(196,181,253,0.18)',
            color: 'rgba(196,181,253,0.7)',
          }}
          aria-label="スワイプ画面に戻る"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-black text-base leading-tight" style={{ color: '#faf5ff' }}>Vライバー登録</h1>
          <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>プロフィールを作成しましょう ✦</p>
        </div>
      </header>

      <RegisterForm />
    </div>
  );
}
