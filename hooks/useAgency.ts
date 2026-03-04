'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function storageUrl(bucket: string, path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export interface AgencyInfo {
  id: string;
  slug: string;
  name: string;
  description: string;
  website_url: string | null;
  twitter_handle: string | null;
}

export interface AgencyVoice {
  id: string;
  catchphrase: string;
  voiceUrl: string;
  is_boosted: boolean;
}

export interface AgencyVliver {
  profileId: string;
  name: string;
  handle: string;
  description: string;
  imageUrl: string;
  tags: string[];
  twitterHandle: string;
  platformLinks: Record<string, string>;
  voices: AgencyVoice[];
}

export function useAgency(slug: string) {
  const [agency, setAgency]   = useState<AgencyInfo | null>(null);
  const [vlivers, setVlivers] = useState<AgencyVliver[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from('agencies')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(async ({ data: agencyData, error }) => {
        if (error || !agencyData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setAgency(agencyData);

        const { data: profilesData, error: profilesError } = await supabase
          .from('vliver_profiles')
          .select(`
            id, name, handle, description, image_path, tags,
            twitter_handle, platform_links,
            voice_posts (id, catch_copy, voice_path, is_boosted, is_published)
          `)
          .eq('agency_id', agencyData.id)
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('useAgency:', profilesError);
          setLoading(false);
          return;
        }

        const mapped: AgencyVliver[] = (profilesData ?? []).map((p: any) => ({
          profileId:     p.id,
          name:          p.name,
          handle:        p.handle ? `@${p.handle}` : '',
          description:   p.description ?? '',
          imageUrl:      storageUrl('vlivers-images', p.image_path),
          tags:          p.tags ?? [],
          twitterHandle: p.twitter_handle ?? '',
          platformLinks: p.platform_links ?? {},
          voices: (p.voice_posts ?? [])
            .filter((v: any) => v.is_published)
            .map((v: any) => ({
              id:          v.id,
              catchphrase: v.catch_copy,
              voiceUrl:    storageUrl('vlivers-voices', v.voice_path),
              is_boosted:  v.is_boosted,
            })),
        })).filter((p) => p.voices.length > 0);

        setVlivers(mapped);
        setLoading(false);
      });
  }, [slug]);

  return { agency, vlivers, loading, notFound };
}
