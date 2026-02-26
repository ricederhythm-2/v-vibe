'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMyProfile } from '@/hooks/useMyProfile';

const BRAND = '#EF5285';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile } = useMyProfile();

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <Link
      href="/notifications"
      className="relative w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105"
      style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
      aria-label="通知"
    >
      <Bell className="w-3.5 h-3.5" style={{ color: '#555555' }} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
          style={{ background: BRAND }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
