'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  post_id: string | null;
  catch_copy: string | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, is_read, created_at, post_id, voice_posts(catch_copy)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) console.error('useNotifications:', error);

      setNotifications(
        (data ?? []).map((row) => ({
          id:         row.id,
          type:       row.type,
          is_read:    row.is_read,
          created_at: row.created_at,
          post_id:    row.post_id,
          catch_copy: (row.voice_posts as unknown as { catch_copy: string } | null)?.catch_copy ?? null,
        })),
      );
      setLoading(false);
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
  }, [notifications]);

  return { notifications, unreadCount, loading, markAllRead };
}
