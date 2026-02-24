'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Zap, HeartCrack, Sparkles, ArrowRight } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useVlivers } from '@/hooks/useVlivers';
import type { VLiver } from '@/components/SwipeCard';

export default function FavoritesList() {
  const { orderedIds, removeFavorite, hydrated } = useFavorites();
  const { vliversMap, loading: vliversLoading }  = useVlivers();

  const favorites = orderedIds
    .map((id) => vliversMap.get(id))
    .filter((v): v is VLiver => !!v);

  const currentAudioRef           = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleTogglePlay = useCallback(
    (vliver: VLiver) => {
      if (playingId === vliver.id) {
        currentAudioRef.current?.pause();
        setPlayingId(null);
        return;
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      const audio = new Audio(vliver.voiceUrl);
      audio.preload = 'none';
      audio.addEventListener('ended', () => setPlayingId(null));
      audio.play().catch(() => {});
      currentAudioRef.current = audio;
      setPlayingId(vliver.id);
    },
    [playingId],
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (playingId === id) {
        currentAudioRef.current?.pause();
        currentAudioRef.current = null;
        setPlayingId(null);
      }
      removeFavorite(id);
    },
    [playingId, removeFavorite],
  );

  if (!hydrated || vliversLoading) return null;
  if (favorites.length === 0) return <EmptyState />;

  return (
    <div className="w-full max-w-sm mx-auto px-4 pb-12">
      <p className="text-right text-xs mb-4" style={{ color: 'rgba(196,181,253,0.4)' }}>
        {favorites.length}人をお気に入り中 ✦
      </p>

      <AnimatePresence initial={false}>
        {favorites.map((vliver) => (
          <FavoriteCard
            key={vliver.id}
            vliver={vliver}
            isPlaying={playingId === vliver.id}
            onTogglePlay={() => handleTogglePlay(vliver)}
            onRemove={() => handleRemove(vliver.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 個別カード
// ─────────────────────────────────────────────────────────────
function FavoriteCard({
  vliver, isPlaying, onTogglePlay, onRemove,
}: {
  vliver: VLiver;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="mb-3"
    >
      <div
        className="flex rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${vliver.color}18 0%, #1d1040 100%)`,
          border: `1px solid ${vliver.color}28`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        {/* ── 左: キャラクター画像 ── */}
        <div className="w-24 flex-shrink-0 relative">
          <img
            src={vliver.imageUrl}
            alt={vliver.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
            draggable={false}
          />
          {/* テーマカラーのグラデーションライン */}
          <div
            className="absolute inset-y-0 right-0 w-[1.5px]"
            style={{
              background: `linear-gradient(to bottom, transparent, ${vliver.color}88, transparent)`,
            }}
          />
        </div>

        {/* ── 右: 情報エリア ── */}
        <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
          <div>
            {/* 名前行 */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-black text-[15px] leading-tight truncate flex-1" style={{ color: '#faf5ff' }}>
                {vliver.name}
              </h3>
              {vliver.is_boosted && (
                <span
                  className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #fde68a, #f59e0b)',
                    color: '#78350f',
                  }}
                >
                  <Zap className="w-2 h-2 fill-amber-800" />
                  BOOST
                </span>
              )}
            </div>

            <p className="text-[11px] font-mono truncate" style={{ color: 'rgba(196,181,253,0.4)' }}>
              {vliver.handle}
            </p>

            <p className="text-xs mt-1.5 leading-snug line-clamp-1" style={{ color: 'rgba(250,245,255,0.7)' }}>
              「{vliver.catchphrase}」
            </p>

            {/* タグ */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {vliver.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: `${vliver.color}1a`,
                    color: vliver.color,
                    border: `1px solid ${vliver.color}40`,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* ── ボタン行 ── */}
          <div className="flex items-center gap-2 mt-2.5">

            {/* 試聴ボタン */}
            <button
              onClick={onTogglePlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={
                isPlaying
                  ? {
                      background: vliver.color,
                      color: '#fff',
                      boxShadow: `0 2px 12px ${vliver.color}55`,
                    }
                  : {
                      background: `${vliver.color}1a`,
                      color: vliver.color,
                      border: `1px solid ${vliver.color}40`,
                    }
              }
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  停止
                  {/* 音声波形インジケーター */}
                  <span className="flex items-end gap-[2px] h-3">
                    {[0, 0.15, 0.3].map((delay) => (
                      <motion.span
                        key={delay}
                        className="w-[2px] rounded-full bg-white"
                        animate={{ height: ['4px', '10px', '4px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                      />
                    ))}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  試聴
                </>
              )}
            </button>

            {/* 外すボタン */}
            <button
              onClick={onRemove}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all active:scale-95 hover:scale-105"
              style={{
                color: 'rgba(253,164,175,0.7)',
                border: '1px solid rgba(253,164,175,0.2)',
                background: 'rgba(253,164,175,0.06)',
              }}
              aria-label="お気に入りから外す"
            >
              <HeartCrack className="w-3 h-3" />
              外す
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 空の状態
// ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-6">
      <motion.div
        animate={{ scale: [1, 1.06, 1], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(196,181,253,0.12) 0%, transparent 70%)',
          border: '1.5px solid rgba(196,181,253,0.15)',
        }}
      >
        <Sparkles className="w-10 h-10" style={{ color: 'rgba(196,181,253,0.35)' }} />
      </motion.div>

      <div>
        <h2 className="text-xl font-black" style={{ color: '#faf5ff' }}>
          まだお気に入りがいません
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(196,181,253,0.45)' }}>
          スワイプしてピンとくる声に<br />出会いましょう ✦
        </p>
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
        }}
      >
        スワイプして探す
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
