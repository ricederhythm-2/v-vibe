import AppHeader from '@/components/AppHeader';
import VoicePostForm from '@/components/VoicePostForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ボイス投稿 | OshiVox' };

export default function PostPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <AppHeader showBack />
      <main className="pt-6"><VoicePostForm /></main>
    </div>
  );
}
