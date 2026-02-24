'use client';

import { useState, useEffect, useCallback } from 'react';

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
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setIds((prev) => prev.filter((i) => i !== id));
  }, []);

  return {
    likedIds: new Set(ids),   // スワイプ画面: O(1) has() 検索
    orderedIds: ids,          // 一覧画面: 追加順配列
    addFavorite,
    removeFavorite,
    hydrated,
  };
}
