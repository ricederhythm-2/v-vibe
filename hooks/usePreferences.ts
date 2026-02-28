'use client';

import { useState, useEffect, useCallback } from 'react';

const KEY = 'oshivox-prefs';

export interface TagWeights {
  [tag: string]: number;
}

/**
 * コンテンツベースフィルタリング用の嗜好ウェイト hook。
 *
 * ── アルゴリズム概要 ──
 * VLiver ごとのタグを次元とする嗜好ベクトルを localStorage に永続化。
 * LIKE → タグスコア +1
 * PASS → タグスコア −0.3（「嫌い」より「今は気分じゃない」の可能性を考慮）
 *
 * ── 既知の限界 ──
 * - 協調フィルタリング（他ユーザーの行動参照）はバックエンドが必要
 * - コールドスタート時はスコアが全員 0 になるため別ロジックで補完が必要
 * - タグ粒度が粗いほど精度が落ちる（本番は細かいタグ設計推奨）
 */
export function usePreferences() {
  const [weights, setWeights] = useState<TagWeights>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setWeights(JSON.parse(raw) as TagWeights);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(weights));
  }, [weights, hydrated]);

  /** LIKEしたVライバーのタグウェイトを +1 */
  const recordLike = useCallback((tags: string[]) => {
    setWeights((prev) => {
      const next = { ...prev };
      tags.forEach((tag) => { next[tag] = (next[tag] ?? 0) + 1; });
      return next;
    });
  }, []);

  /**
   * PASSしたVライバーのタグウェイトをわずかに −0.3。
   * 強くペナルティをかけすぎると、ちょっと気分じゃなかっただけのタグが
   * 永遠に表示されなくなるフィルターバブルを引き起こすため小さい値にする。
   */
  const recordPass = useCallback((tags: string[]) => {
    setWeights((prev) => {
      const next = { ...prev };
      tags.forEach((tag) => { next[tag] = (next[tag] ?? 0) - 0.3; });
      return next;
    });
  }, []);

  /** スコアが 0 以外のタグが存在すれば「嗜好データあり」と判断 */
  const hasHistory = Object.values(weights).some((w) => w !== 0);

  return { weights, recordLike, recordPass, hasHistory, hydrated };
}

// ─────────────────────────────────────────────────────────────
// 純粋関数: VLiver のレコメンドスコアを計算
// （hook の外に置くことで useMemo の依存配列をシンプルに保つ）
// ─────────────────────────────────────────────────────────────
export function scoreVLiver(
  tags: string[],
  isBoosted: boolean,
  weights: TagWeights,
): number {
  const tagScore   = tags.reduce((sum, tag) => sum + (weights[tag] ?? 0), 0);
  const boostBonus = isBoosted ? 1.5 : 0; // 将来の Stripe ブースト効果
  return tagScore + boostBonus;
}
