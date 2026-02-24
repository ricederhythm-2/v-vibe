'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type CFScoreMap = Map<string, number>;

/**
 * 協調フィルタリング (CF) スコアを管理する hook。
 *
 * ── 仕組み ──
 * ログイン中ユーザーに対して Supabase RPC `get_cf_scores` を呼び出し、
 * 「自分と好みが似たユーザーが LIKE した投稿」の重み付きスコアを取得する。
 * アルゴリズムは Jaccard 類似度ベースのユーザー間 CF。
 *
 * ── 未ログイン時 ──
 * cfScores は空 Map のまま。既存のコンテンツベースフィルタリングのみ動作。
 *
 * ── saveAction ──
 * スワイプ結果 (like/pass) を swipe_events テーブルに保存する。
 * fire-and-forget（失敗してもスワイプ体験は壊れない）。
 * セッション中に同じ投稿を再度スワイプした場合は upsert で上書き。
 */
export function useCFScores() {
  const [cfScores, setCFScores] = useState<CFScoreMap>(new Map());
  const userIdRef               = useRef<string | null>(null);
  // createClient は1回だけ呼ぶ
  const supabase                = useRef(createClient()).current;

  useEffect(() => {
    // 初期ユーザー取得
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        userIdRef.current = data.user.id;
        fetchCFScores(data.user.id, supabase).then(setCFScores);
      }
    });

    // ログイン・ログアウトに追従
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          userIdRef.current = session.user.id;
          fetchCFScores(session.user.id, supabase).then(setCFScores);
        } else {
          userIdRef.current = null;
          setCFScores(new Map());
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  /**
   * スワイプ結果を swipe_events テーブルに保存する。
   * 未ログイン時は何もしない（localStorage ベースのコンテンツ CF は継続）。
   */
  const saveAction = useCallback(
    async (postId: string, action: 'like' | 'pass') => {
      const userId = userIdRef.current;
      if (!userId) return;

      const { error } = await supabase
        .from('swipe_events')
        .upsert(
          { user_id: userId, voice_post_id: postId, action },
          { onConflict: 'user_id,voice_post_id' },
        );

      if (error) {
        // 保存失敗はサイレントに（スワイプ体験を妨げない）
        console.error('saveAction:', error);
      }
    },
    [supabase],
  );

  return { cfScores, saveAction };
}

// ─────────────────────────────────────────────────────────────
// 内部ユーティリティ
// ─────────────────────────────────────────────────────────────

async function fetchCFScores(
  userId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<CFScoreMap> {
  const { data, error } = await supabase.rpc('get_cf_scores', {
    p_user_id: userId,
  });

  if (error || !data) {
    if (error) console.error('get_cf_scores:', error);
    return new Map();
  }

  return new Map(
    (data as { post_id: string; cf_score: number }[]).map((row) => [
      row.post_id,
      row.cf_score,
    ]),
  );
}
