'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface VoicePost {
  id: string;
  catch_copy: string;
  voice_path: string;
  is_published: boolean;
  created_at: string;
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
        .then(({ data, error }) => {
          if (error) console.error('useMyPosts:', error);
          setPosts(data ?? []);
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
        setPosts(data ?? []);
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
