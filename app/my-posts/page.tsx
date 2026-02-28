import AppHeader from '@/components/AppHeader';
import MyPostsList from '@/components/MyPostsList';

export const dynamic = 'force-dynamic';
export const metadata = { title: '投稿管理 | V-Vibe' };

export default function MyPostsPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <AppHeader showBack />
      <main className="pt-6"><MyPostsList /></main>
    </div>
  );
}
