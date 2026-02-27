import { Mic } from 'lucide-react';
import MyPostsList from '@/components/MyPostsList';
import SubHeader from '@/components/SubHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: '投稿管理 | V-Vibe' };

export default function MyPostsPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <SubHeader>
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4" style={{ color: '#EF5285' }} />
          <h1 className="font-black text-base" style={{ color: '#111111' }}>投稿管理</h1>
        </div>
      </SubHeader>
      <main className="pt-6"><MyPostsList /></main>
    </div>
  );
}
