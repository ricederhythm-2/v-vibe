export const dynamic = 'force-dynamic';
export const metadata = { title: '通知 | OshiVox' };

import AppHeader from '@/components/AppHeader';
import NotificationsContent from './content';

export default function NotificationsPage() {
  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <AppHeader showBack />
      <main className="pt-6">
        <NotificationsContent />
      </main>
    </div>
  );
}
