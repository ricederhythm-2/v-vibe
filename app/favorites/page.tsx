import { Heart } from 'lucide-react';
import FavoritesList from '@/components/FavoritesList';
import SubHeader from '@/components/SubHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'お気に入り | V-Vibe' };

export default function FavoritesPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <SubHeader>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 fill-current" style={{ color: '#EF5285' }} />
          <h1 className="font-black text-base" style={{ color: '#111111' }}>お気に入り</h1>
        </div>
      </SubHeader>
      <main className="pt-6"><FavoritesList /></main>
    </div>
  );
}
