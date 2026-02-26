'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { Heart, RotateCcw, Sparkles, X, UserPlus, Mic } from 'lucide-react';
import SwipeCard, { type SwipeCardHandle } from '@/components/SwipeCard';
import { useFavorites } from '@/hooks/useFavorites';
import { usePreferences, scoreVLiver } from '@/hooks/usePreferences';
import { useVlivers } from '@/hooks/useVlivers';
import { useCFScores } from '@/hooks/useCFScores';
import { useMyProfile } from '@/hooks/useMyProfile';
import UserMenu from '@/components/UserMenu';
import NotificationBell from '@/components/NotificationBell';

const BRAND = '#EF5285';

export default function HomePage() {
  const [seenIds, setSeenIds]     = useState<Set<string>>(new Set());
  const { likedIds, addFavorite } = useFavorites();
  const { weights, recordLike, recordPass, hasHistory } = usePreferences();
  const { vlivers, loading }      = useVlivers();
  const { cfScores, saveAction }  = useCFScores();
  const { profile: myProfile }    = useMyProfile();

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const cardRef         = useRef<SwipeCardHandle>(null);

  const remaining = useMemo(() => {
    const unseen = vlivers.filter((v) => !seenIds.has(v.id));

    if (!hasHistory && cfScores.size === 0) {
      return [...unseen].sort((a, b) => Number(b.is_boosted) - Number(a.is_boosted));
    }

    return [...unseen].sort((a, b) => {
      const contentA = scoreVLiver(a.tags, a.is_boosted, weights);
      const contentB = scoreVLiver(b.tags, b.is_boosted, weights);
      const cfA      = cfScores.get(a.id) ?? 0;
      const cfB      = cfScores.get(b.id) ?? 0;

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

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!current) return;
      stopCurrentAudio();

      if (direction === 'right') {
        addFavorite(current.id);
        recordLike(current.tags);
        saveAction(current.id, 'like');
      } else {
        recordPass(current.tags);
        saveAction(current.id, 'pass');
      }

      setSeenIds((prev) => new Set([...prev, current.id]));
    },
    [current, addFavorite, recordLike, recordPass, stopCurrentAudio, saveAction],
  );

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    cardRef.current?.swipeTo(direction);
  }, []);

  const handleReset = useCallback(() => {
    stopCurrentAudio();
    setSeenIds(new Set());
  }, [stopCurrentAudio]);

  return (
    <div className="h-dvh overflow-hidden flex flex-col" style={{ background: '#FFFFFF' }}>

      {/* ヘッダー */}
      <header className="w-full flex-shrink-0" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <div className="w-full max-w-[430px] mx-auto flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: BRAND }} />
            <span className="font-black text-xl tracking-tight" style={{ color: '#111111' }}>
              V-Vibe
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/favorites"
              className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all hover:scale-105"
              style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
              aria-label="お気に入り"
            >
              <Heart className="w-3.5 h-3.5" style={{ color: BRAND, fill: BRAND }} />
              <span className="text-xs font-bold" style={{ color: BRAND }}>{likedCount}</span>
              {likedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: BRAND }} />
              )}
            </Link>
            {!myProfile && (
              <Link
                href="/register"
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105"
                style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
                aria-label="Vライバー登録"
              >
                <UserPlus className="w-3.5 h-3.5" style={{ color: '#555555' }} />
              </Link>
            )}
            <Link
              href="/post"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105"
              style={{ border: '1px solid #E8E8E8', background: '#FFFFFF' }}
              aria-label="ボイス投稿"
            >
              <Mic className="w-3.5 h-3.5" style={{ color: '#555555' }} />
            </Link>
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* カードエリア */}
      <main className="flex-1 min-h-0 w-full max-w-[430px] mx-auto px-4 pt-4">
        <div className="relative w-full h-full">
          {loading ? (
            <div className="absolute inset-0 rounded-3xl animate-pulse" style={{ background: '#F5F5F5', border: '1px solid #E8E8E8' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8" style={{ color: '#DDDDDD' }} />
                <p className="text-xs" style={{ color: '#AAAAAA' }}>Vライバーを読み込み中…</p>
              </div>
            </div>
          ) : !isFinished ? (
            <>
              {/* 背面カード */}
              {next && (
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
                  style={{ transform: 'scale(0.93) translateY(14px)', opacity: 0.4, background: '#FFFFFF', border: '1px solid #E8E8E8' }}
                />
              )}

              {/* 前面カード */}
              {current && (
                <SwipeCard
                  key={current.id}
                  ref={cardRef}
                  vliver={current}
                  onSwipe={handleSwipe}
                  onAudioPlay={handleAudioPlay}
                  recommendBadge={
                    (hasHistory || cfScores.size > 0)
                      ? <RecommendBadge vliver={current} weights={weights} cfScores={cfScores} />
                      : undefined
                  }
                />
              )}
            </>
          ) : (
            /* 全員チェック完了 */
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: `${BRAND}15`, border: `2px solid ${BRAND}30` }}
              >
                <Heart className="w-9 h-9" style={{ color: BRAND, fill: BRAND }} />
              </div>
              <div>
                <h2 className="text-2xl font-black" style={{ color: '#111111' }}>全員チェック完了！</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#555555' }}>
                  {likedCount > 0
                    ? `${likedCount}人のVライバーをお気に入りに追加しました`
                    : 'まだ誰もお気に入りしていません。'}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[200px]">
                {likedCount > 0 && (
                  <Link
                    href="/favorites"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                    style={{ background: BRAND, boxShadow: `0 4px 16px ${BRAND}40` }}
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    お気に入りを見る
                  </Link>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ color: '#555555', border: '1px solid #E8E8E8', background: '#FFFFFF' }}
                >
                  <RotateCcw className="w-4 h-4" />
                  もう一度見る
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ボトムアクションボタン */}
      {!isFinished && !loading && (
        <div className="w-full max-w-[430px] mx-auto flex items-center justify-center gap-10 py-5">
          <button
            onClick={() => handleButtonSwipe('left')}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-105"
            style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            aria-label="パス"
          >
            <X className="w-6 h-6" style={{ color: '#AAAAAA' }} />
          </button>
          <button
            onClick={() => handleButtonSwipe('right')}
            className="w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center active:scale-90 transition-transform hover:scale-105"
            style={{ background: BRAND, boxShadow: `0 6px 24px ${BRAND}50` }}
            aria-label="お気に入りに追加"
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </button>
        </div>
      )}
    </div>
  );
}

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
  const cfScore      = cfScores.get(vliver.id) ?? 0;
  const contentScore = vliver.tags.reduce((s, t) => s + (weights[t] ?? 0), 0);
  const showCF       = cfScore > 0 && cfScore * 0.6 > contentScore * 0.4;

  if (!showCF) return null;

  return (
    <p className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: '#AAAAAA' }}>
      <Sparkles className="w-2.5 h-2.5" style={{ color: '#AAAAAA' }} />
      似た趣味のユーザーに人気
    </p>
  );
}
