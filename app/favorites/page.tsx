import { ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import FavoritesList from '@/components/FavoritesList';

export const metadata = {
  title: 'お気に入り | V-Vibe',
};

export default function FavoritesPage() {
  return (
    <div className="min-h-dvh">
      <header className="w-full max-w-sm mx-auto flex items-center gap-3 px-5 pt-5 pb-4">
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
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 fill-current" style={{ color: '#f0abfc' }} />
          <h1 className="font-black text-base" style={{ color: '#faf5ff' }}>お気に入り</h1>
        </div>
      </header>

      {/* 一覧（client component） */}
      <FavoritesList />
    </div>
  );
}
