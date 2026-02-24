'use client';

import { useCallback, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { Heart, RotateCcw, Sparkles, X, UserPlus, Mic } from 'lucide-react';
import SwipeCard, { type SwipeCardHandle } from '@/components/SwipeCard';
import { useFavorites } from '@/hooks/useFavorites';
import { usePreferences, scoreVLiver } from '@/hooks/usePreferences';
import { useVlivers } from '@/hooks/useVlivers';
import { useCFScores } from '@/hooks/useCFScores';
import UserMenu from '@/components/UserMenu';

export default function HomePage() {
  // index の代わりに「見たID集合」で管理することで、
  // レコメンドの順番が変わっても整合性が取れる
  const [seenIds, setSeenIds]         = useState<Set<string>>(new Set());
  const { likedIds, addFavorite }     = useFavorites();
  const { weights, recordLike, recordPass, hasHistory } = usePreferences();
  const { vlivers, loading }          = useVlivers();
  const { cfScores, saveAction }      = useCFScores();

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const cardRef         = useRef<SwipeCardHandle>(null);

  // ─────────────────────────────────────────────────────────────
  // レコメンドソート
  //
  // 嗜好データあり → タグスコア + is_boosted ボーナスで降順ソート
  // コールドスタート → is_boosted 優先 → 元の登録順
  //
  // seenIds と weights のどちらかが変わるたびに再計算される。
  // LIKE/PASS のたびに weights が更新され、次のカード順が即座に変化する。
  // ─────────────────────────────────────────────────────────────
  const remaining = useMemo(() => {
    const unseen = vlivers.filter((v) => !seenIds.has(v.id));

    // コールドスタート: 嗜好データなし & CF データなし → is_boosted 優先
    if (!hasHistory && cfScores.size === 0) {
      return [...unseen].sort((a, b) => Number(b.is_boosted) - Number(a.is_boosted));
    }

    return [...unseen].sort((a, b) => {
      const contentA = scoreVLiver(a.tags, a.is_boosted, weights);
      const contentB = scoreVLiver(b.tags, b.is_boosted, weights);
      const cfA      = cfScores.get(a.id) ?? 0;
      const cfB      = cfScores.get(b.id) ?? 0;

      // CF データがある場合はハイブリッドスコア（CF 60% + コンテンツ 40%）
      // CF データがない場合はコンテンツのみ（既存の動作）
      if (cfScores.size > 0) {
        return (contentB * 0.4 + cfB * 0.6) - (contentA * 0.4 + cfA * 0.6);
      }
      return contentB - contentA;
    });
  }, [seenIds, weights, hasHistory, cfScores]);

  const current    = remaining[0];
  const next       = remaining[1];
  const isFinished = remaining.length === 0;
  const likedCount = likedIds.size;

  // ── 音声管理 ──
  const stopCurrentAudio = useCallback(() => {
    if (!currentAudioRef.current) return;
    currentAudioRef.current.pause();
    currentAudioRef.current.currentTime = 0;
    currentAudioRef.current = null;
  }, []);

  const handleAudioPlay = useCallback((audio: HTMLAudioElement) => {
    if (currentAudioRef.current && currentAudioRef.current !== audio) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    currentAudioRef.current = audio;
  }, []);

  // ── スワイプ処理 ──
  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!current) return;
      stopCurrentAudio();

      if (direction === 'right') {
        addFavorite(current.id);
        recordLike(current.tags);          // コンテンツ嗜好ウェイト更新
        saveAction(current.id, 'like');    // CF用DBに保存（ログイン時のみ）
      } else {
        recordPass(current.tags);          // 弱いペナルティ
        saveAction(current.id, 'pass');    // CF用DBに保存（ログイン時のみ）
      }

      setSeenIds((prev) => new Set([...prev, current.id]));
    },
    [current, addFavorite, recordLike, recordPass, stopCurrentAudio, saveAction],
  );

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    cardRef.current?.swipeTo(direction);
  }, []);

  // リセット: 見たカードはリセット、嗜好ウェイトは保持（好みは蓄積され続ける）
  const handleReset = useCallback(() => {
    stopCurrentAudio();
    setSeenIds(new Set());
  }, [stopCurrentAudio]);

  return (
    <div className="min-h-dvh flex flex-col items-center overflow-hidden">

      {/* ━━━ ヘッダー ━━━ */}
      <header className="w-full max-w-sm flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-fuchsia-300" />
          <span
            className="font-black text-xl tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #c4b5fd, #f0abfc, #fda4af)' }}
          >
            V-Vibe
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/favorites"
            className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all hover:scale-105"
            style={{ background: 'rgba(196,181,253,0.08)', border: '1px solid rgba(196,181,253,0.18)' }}
            aria-label="お気に入り"
          >
            <Heart className="w-3.5 h-3.5 text-fuchsia-300 fill-fuchsia-300" />
            <span className="text-violet-200 text-xs font-bold">{likedCount}</span>
            {likedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-fuchsia-400" />
            )}
          </Link>
          <Link
            href="/register"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'rgba(196,181,253,0.08)', border: '1px solid rgba(196,181,253,0.18)' }}
            aria-label="Vライバー登録"
          >
            <UserPlus className="w-3.5 h-3.5 text-violet-300" />
          </Link>
          <Link
            href="/post"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: 'rgba(196,181,253,0.08)', border: '1px solid rgba(196,181,253,0.18)' }}
            aria-label="ボイス投稿"
          >
            <Mic className="w-3.5 h-3.5 text-fuchsia-300" />
          </Link>
          <UserMenu />
        </div>
      </header>

      {/* ━━━ カードエリア ━━━ */}
      <main className="flex-1 w-full max-w-sm px-4 flex items-center justify-center">
        <div className="relative w-full" style={{ height: 'calc(100dvh - 180px)' }}>
          {loading ? (
            /* ローディングスケルトン */
            <div
              className="absolute inset-0 rounded-3xl animate-pulse"
              style={{ background: 'rgba(196,181,253,0.06)', border: '1px solid rgba(196,181,253,0.1)' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-fuchsia-300/30" />
                <p className="text-xs" style={{ color: 'rgba(196,181,253,0.3)' }}>Vライバーを読み込み中…</p>
              </div>
            </div>
          ) : !isFinished ? (
            <>
              {/* 背面カード（次をちら見せ） */}
              {next && (
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
                  style={{ transform: 'scale(0.93) translateY(14px)', opacity: 0.45 }}
                >
                  <div
                    className="w-full h-full"
                    style={{ background: `linear-gradient(165deg, ${next.color}28 0%, #1d1040 100%)` }}
                  >
                    <img src={next.imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                </div>
              )}

              {/* 前面カード */}
              {current && (
                <>
                  {/* レコメンド理由バッジ（嗜好データがある場合のみ表示） */}
                  {(hasHistory || cfScores.size > 0) && (
                    <RecommendBadge vliver={current} weights={weights} cfScores={cfScores} />
                  )}
                  <SwipeCard
                    key={current.id}
                    ref={cardRef}
                    vliver={current}
                    onSwipe={handleSwipe}
                    onAudioPlay={handleAudioPlay}
                  />
                </>
              )}
            </>
          ) : (
            /* 全員チェック完了 */
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed44, #ec489944)',
                  border: '2px solid rgba(196,181,253,0.25)',
                  boxShadow: '0 0 40px rgba(196,181,253,0.15)',
                }}
              >
                <Heart className="w-11 h-11" style={{ color: '#f0abfc', fill: '#f0abfc' }} />
              </div>
              <div>
                <h2 className="text-violet-50 text-2xl font-black">全員チェック完了！</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(196,181,253,0.5)' }}>
                  {likedCount > 0
                    ? `${likedCount}人のVライバーをお気に入りに追加しました ✨`
                    : 'まだ誰もお気に入りしていません。'}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[200px]">
                {likedCount > 0 && (
                  <Link
                    href="/favorites"
                    className="flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', boxShadow: '0 4px 20px rgba(168,85,247,0.3)' }}
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    お気に入りを見る
                  </Link>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm transition-all hover:scale-105"
                  style={{
                    color: 'rgba(196,181,253,0.7)',
                    border: '1px solid rgba(196,181,253,0.2)',
                    background: 'rgba(196,181,253,0.06)',
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  もう一度見る
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ━━━ ボトムアクションボタン ━━━ */}
      {!isFinished && (
        <div className="w-full max-w-sm flex items-center justify-center gap-10 py-5">
          <button
            onClick={() => handleButtonSwipe('left')}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-105"
            style={{ background: 'rgba(109,40,217,0.15)', border: '1.5px solid rgba(196,181,253,0.2)' }}
            aria-label="パス"
          >
            <X className="w-6 h-6 text-violet-300/70" />
          </button>
          <button
            onClick={() => handleButtonSwipe('right')}
            className="w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center active:scale-90 transition-transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #f472b6 0%, #a855f7 100%)',
              boxShadow: '0 6px 28px rgba(244,114,182,0.40), 0 2px 8px rgba(0,0,0,0.2)',
            }}
            aria-label="お気に入りに追加"
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// レコメンド理由バッジ
// 「あなたが好きな #歌 タグ」のように表示して
// なぜこのVライバーが出てきたかを可視化する
// ─────────────────────────────────────────────────────────────
import type { VLiver } from '@/components/SwipeCard';
import type { TagWeights } from '@/hooks/usePreferences';
import type { CFScoreMap } from '@/hooks/useCFScores';

function RecommendBadge({
  vliver,
  weights,
  cfScores,
}: {
  vliver: VLiver;
  weights: TagWeights;
  cfScores: CFScoreMap;
}) {
  // コンテンツスコアの主要タグ
  const topTag = vliver.tags
    .filter((tag) => (weights[tag] ?? 0) > 0)
    .sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0))[0];

  const cfScore      = cfScores.get(vliver.id) ?? 0;
  const contentScore = vliver.tags.reduce((s, t) => s + (weights[t] ?? 0), 0);

  // CF スコアがコンテンツスコアより支配的な場合は CF バッジを優先表示
  const showCF = cfScore > 0 && cfScore * 0.6 > contentScore * 0.4;

  if (!showCF && !topTag) return null;

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-10
                 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                 whitespace-nowrap pointer-events-none"
      style={{
        background: 'rgba(196,181,253,0.12)',
        border: '1px solid rgba(196,181,253,0.22)',
        backdropFilter: 'blur(8px)',
        color: 'rgba(250,245,255,0.75)',
      }}
    >
      <Sparkles className="w-3 h-3 text-fuchsia-300" />
      {showCF ? (
        '似た趣味のユーザーに人気'
      ) : (
        <>
          あなたが好きな
          <span style={{ color: vliver.color, fontWeight: 800 }}>#{topTag}</span>
          タグ
        </>
      )}
    </div>
  );
}
