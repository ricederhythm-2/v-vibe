import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VoicePostForm from '@/components/VoicePostForm';

export const metadata = { title: 'ボイス投稿 | V-Vibe' };

export default function PostPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <header
        className="w-full max-w-sm mx-auto flex items-center gap-3 px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid #F0F0F0' }}
      >
        <Link
          href="/"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
          aria-label="スワイプ画面に戻る"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: '#555555' }} />
        </Link>
        <div>
          <h1 className="font-black text-base leading-tight" style={{ color: '#111111' }}>ボイス投稿</h1>
          <p className="text-xs" style={{ color: '#AAAAAA' }}>スワイプ画面に1枚追加されます</p>
        </div>
      </header>
      <VoicePostForm />
    </div>
  );
}
