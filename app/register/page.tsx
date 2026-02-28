import AppHeader from '@/components/AppHeader';
import RegisterForm from '@/components/RegisterForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vライバー登録 | V-Vibe' };

export default function RegisterPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <AppHeader showBack />
      <main className="pt-6"><RegisterForm /></main>
    </div>
  );
}
