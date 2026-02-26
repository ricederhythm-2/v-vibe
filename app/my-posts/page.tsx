import { ArrowLeft, Mic } from 'lucide-react';
import Link from 'next/link';
import MyPostsList from '@/components/MyPostsList';

export const dynamic = 'force-dynamic';
export const metadata = { title: '投稿管理 | V-Vibe' };

export default function MyPostsPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <header className="w-full" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <div className="max-w-[430px] mx-auto flex items-center gap-3 px-5 pt-5 pb-4">
          <Link
            href="/"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
            aria-label="スワイプ画面に戻る"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: '#555555' }} />
          </Link>
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" style={{ color: '#EF5285' }} />
            <h1 className="font-black text-base" style={{ color: '#111111' }}>投稿管理</h1>
          </div>
        </div>
      </header>
      <main className="pt-6"><MyPostsList /></main>
    </div>
  );
}
