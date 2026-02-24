'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface VliverProfile {
  id: string;
  owner_id: string;
  name: string;
  handle: string;
  image_path: string | null;
  color: string;
  tags: string[];
  description: string;
}

/** ログイン中ユーザーの VLiver プロフィールを取得する */
export function useMyProfile() {
  const [profile, setProfile]   = useState<VliverProfile | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .from('vliver_profiles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .then(({ data, error }) => {
          if (error) console.error('useMyProfile:', error);
          setProfile(data?.[0] ?? null);
          setLoading(false);
        });
    });
  }, []);

  return { profile, loading };
}
