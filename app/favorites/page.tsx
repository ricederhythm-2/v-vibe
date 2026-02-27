import FavoritesList from '@/components/FavoritesList';
import AppHeader from '@/components/AppHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'お気に入り | V-Vibe' };

export default function FavoritesPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <AppHeader />
      <main className="pt-6"><FavoritesList /></main>
    </div>
  );
}
