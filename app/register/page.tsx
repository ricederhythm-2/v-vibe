import RegisterForm from '@/components/RegisterForm';
import SubHeader from '@/components/SubHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vライバー登録 | V-Vibe' };

export default function RegisterPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <SubHeader>
        <div>
          <h1 className="font-black text-base leading-tight" style={{ color: '#111111' }}>Vライバー登録</h1>
          <p className="text-xs" style={{ color: '#AAAAAA' }}>プロフィールを作成しましょう</p>
        </div>
      </SubHeader>
      <main className="pt-6"><RegisterForm /></main>
    </div>
  );
}
