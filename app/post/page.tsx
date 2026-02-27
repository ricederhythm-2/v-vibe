import VoicePostForm from '@/components/VoicePostForm';
import SubHeader from '@/components/SubHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ボイス投稿 | V-Vibe' };

export default function PostPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <SubHeader>
        <div>
          <h1 className="font-black text-base leading-tight" style={{ color: '#111111' }}>ボイス投稿</h1>
          <p className="text-xs" style={{ color: '#AAAAAA' }}>スワイプ画面に1枚追加されます</p>
        </div>
      </SubHeader>
      <main className="pt-6"><VoicePostForm /></main>
    </div>
  );
}
