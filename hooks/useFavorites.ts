'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'v-vibe-favorites';

/**
 * お気に入りの Vライバー ID を localStorage に永続化する hook。
 *
 * - likedIds      : O(1) 検索用 Set（スワイプ画面で使用）
 * - orderedIds    : 追加順を保持した配列（一覧画面で使用）
 * - hydrated      : SSR と localStorage の不一致を防ぐフラグ
 */
export function useFavorites() {
  const [ids, setIds]           = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const userIdRef               = useRef<string | null>(null);
  const supabase                = useRef(createClient()).current;

  // ログイン中ユーザーIDを取得
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      userIdRef.current = session?.user?.id ?? null;
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // ── マウント後に localStorage から復元 ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      /* localStorage 読み取り失敗時は初期値のまま */
    }
    setHydrated(true);
  }, []);

  // ── ids が変わるたびに localStorage へ保存 ──
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, hydrated]);

  const addFavorite = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    const userId = userIdRef.current;
    if (userId) {
      supabase.from('favorites').upsert({ user_id: userId, post_id: id }).then(({ error }) => {
        if (error) console.error('favorites insert:', error);
      });
    }
  }, [supabase]);

  const removeFavorite = useCallback((id: string) => {
    setIds((prev) => prev.filter((i) => i !== id));
    const userId = userIdRef.current;
    if (userId) {
      supabase.from('favorites').delete().eq('user_id', userId).eq('post_id', id).then(({ error }) => {
        if (error) console.error('favorites delete:', error);
      });
    }
  }, [supabase]);

  return {
    likedIds: new Set(ids),   // スワイプ画面: O(1) has() 検索
    orderedIds: ids,          // 一覧画面: 追加順配列
    addFavorite,
    removeFavorite,
    hydrated,
  };
}
