'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface VoicePost {
  id: string;
  catch_copy: string;
  voice_path: string;
  is_published: boolean;
  created_at: string;
  like_count: number;
}

export function useMyPosts() {
  const [posts, setPosts]     = useState<VoicePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .from('voice_posts')
        .select('id, catch_copy, voice_path, is_published, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .then(async ({ data, error }) => {
          if (error) console.error('useMyPosts:', error);
          const rows = data ?? [];

          // いいね数を取得
          const postIds = rows.map((p) => p.id);
          let likeMap: Record<string, number> = {};
          if (postIds.length > 0) {
            const { data: likeData } = await supabase
              .from('swipe_events')
              .select('voice_post_id')
              .eq('action', 'like')
              .in('voice_post_id', postIds);
            for (const row of likeData ?? []) {
              likeMap[row.voice_post_id] = (likeMap[row.voice_post_id] ?? 0) + 1;
            }
          }

          setPosts(rows.map((p) => ({ ...p, like_count: likeMap[p.id] ?? 0 })));
          setLoading(false);
        });
    });
  }, []);

  const deletePost = useCallback(async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from('voice_posts').delete().eq('id', id);
    if (error) {
      console.error('deletePost:', error);
      // Re-fetch on error to restore state
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('voice_posts')
          .select('id, catch_copy, voice_path, is_published, created_at')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        setPosts((data ?? []).map((p) => ({ ...p, like_count: 0 })));
      }
    }
  }, []);

  const updateCatchCopy = useCallback(async (id: string, catchCopy: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, catch_copy: catchCopy } : p)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from('voice_posts')
      .update({ catch_copy: catchCopy })
      .eq('id', id);
    if (error) console.error('updateCatchCopy:', error);
  }, []);

  return { posts, loading, deletePost, updateCatchCopy };
}
