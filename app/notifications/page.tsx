'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

const BRAND = '#EF5285';

export default function NotificationsPage() {
  const { notifications, loading, markAllRead } = useNotifications();

  useEffect(() => {
    markAllRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh" style={{ background: '#FFFFFF' }}>
      <header className="w-full" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <div className="max-w-[430px] mx-auto flex items-center gap-3 px-5 pt-5 pb-4">
          <Link
            href="/"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
            aria-label="戻る"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: '#555555' }} />
          </Link>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: BRAND }} />
            <h1 className="font-black text-base" style={{ color: '#111111' }}>通知</h1>
          </div>
        </div>
      </header>

      <main className="pt-6">
        {loading ? null : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="w-full max-w-[430px] mx-auto px-4 pb-12">
            <AnimatePresence initial={false}>
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

function NotificationItem({ notification: n }: { notification: Notification }) {
  const dateLabel = new Date(n.created_at).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3"
    >
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
        style={{
          background: n.is_read ? '#FFFFFF' : `${BRAND}08`,
          border: `1px solid ${n.is_read ? '#E8E8E8' : `${BRAND}25`}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${BRAND}15` }}
        >
          <Heart className="w-3.5 h-3.5" style={{ color: BRAND, fill: BRAND }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug" style={{ color: '#111111' }}>
            あなたの投稿がお気に入りに追加されました
          </p>
          {n.catch_copy && (
            <p className="text-xs mt-1 truncate" style={{ color: '#555555' }}>
              「{n.catch_copy}」
            </p>
          )}
          <p className="text-[10px] mt-1.5" style={{ color: '#AAAAAA' }}>{dateLabel}</p>
        </div>
        {!n.is_read && (
          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: BRAND }} />
        )}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: `${BRAND}10`, border: `1.5px solid ${BRAND}20` }}
      >
        <Bell className="w-9 h-9" style={{ color: `${BRAND}60` }} />
      </div>
      <div>
        <h2 className="text-xl font-black" style={{ color: '#111111' }}>通知はありません</h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: '#555555' }}>
          投稿がお気に入りされると<br />ここに通知が届きます
        </p>
      </div>
    </div>
  );
}
