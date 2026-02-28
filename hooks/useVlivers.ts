'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { VLiver } from '@/components/SwipeCard';
import { VLIVERS } from '@/data/vlivers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function storageUrl(bucket: string, path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path; // 外部URL（サンプルデータ等）はそのまま返す
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function useVlivers() {
  const [vlivers, setVlivers]   = useState<VLiver[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('voice_posts')
      .select(`
        id,
        catch_copy,
        voice_path,
        is_boosted,
        created_at,
        vliver_profiles (*)
      `)
      .eq('is_published', true)
      .order('is_boosted', { ascending: false })
      .order('created_at',  { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('useVlivers:', error);
          setLoading(false);
          return;
        }
        const rows = (data ?? []).filter((row) => row.vliver_profiles);
        if (rows.length === 0) {
          setVlivers(VLIVERS);
          setLoading(false);
          return;
        }
        setVlivers(
          rows
            .map((row) => {
              const p = row.vliver_profiles as unknown as {
                id: string; name: string; handle: string;
                image_path: string | null; color: string;
                tags: string[]; description: string;
                twitter_handle: string;
              };
              return {
                id:          row.id,
                name:        p.name,
                handle:      p.handle ? `@${p.handle}` : '',
                catchphrase: row.catch_copy,
                description: p.description,
                imageUrl:    storageUrl('vlivers-images', p.image_path),
                voiceUrl:    storageUrl('vlivers-voices', row.voice_path),
                tags:          p.tags ?? [],
                color:         p.color,
                is_boosted:    row.is_boosted,
                twitterHandle: p.twitter_handle ?? '',
                platformLinks: (p as any).platform_links ?? {},
              };
            }),
          );
        setLoading(false);
      });
  }, []);

  const vliversMap = new Map(vlivers.map((v) => [v.id, v]));

  return { vlivers, vliversMap, loading };
}
