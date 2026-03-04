'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Heart, Zap, Building2 } from 'lucide-react';
import { PLATFORMS } from '@/lib/platforms';
import { useFavorites } from '@/hooks/useFavorites';
import { useAgency, type AgencyVliver, type AgencyVoice } from '@/hooks/useAgency';

const BRAND = '#EF5285';
const BOOST = '#FEEE7D';

export default function AgencyContent({ slug }: { slug: string }) {
  const { agency, vlivers, loading, notFound } = useAgency(slug);
  const { likedIds, addFavorite, removeFavorite } = useFavorites();

  const currentAudioRef           = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleTogglePlay = useCallback((voice: AgencyVoice) => {
    if (playingId === voice.id) {
      currentAudioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    const audio = new Audio(voice.voiceUrl);
    audio.preload = 'none';
    audio.addEventListener('ended', () => setPlayingId(null));
    audio.play().catch(() => {});
    currentAudioRef.current = audio;
    setPlayingId(voice.id);
  }, [playingId]);

  const handleToggleFavorite = useCallback((voiceId: string) => {
    if (likedIds.has(voiceId)) {
      removeFavorite(voiceId);
    } else {
      addFavorite(voiceId);
    }
  }, [likedIds, addFavorite, removeFavorite]);

  if (loading) return <AgencySkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6 text-center">
        <Building2 className="w-12 h-12" style={{ color: '#E0E0E0' }} />
        <p className="font-black text-lg" style={{ color: '#111111' }}>事務所が見つかりません</p>
        <p className="text-sm" style={{ color: '#AAAAAA' }}>URLをご確認ください</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[430px] mx-auto pb-16">
      {/* 事務所ヘッダー */}
      <div
        className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(160deg, #FFF0F5 0%, #FFFFFF 100%)', borderBottom: '1px solid #F0F0F0' }}
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: BRAND, boxShadow: `0 4px 16px ${BRAND}40` }}
          >
            <span className="text-2xl font-black text-white">
              {agency?.name?.[0] ?? 'L'}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-tight" style={{ color: '#111111' }}>
              {agency?.name}
            </h1>
            {agency?.twitter_handle && (
              <a
                href={`https://x.com/${agency.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs mt-0.5 w-fit"
                style={{ color: '#AAAAAA' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @{agency.twitter_handle}
              </a>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-3" style={{ color: '#555555' }}>
          {agency?.description}
        </p>

        <span
          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: `${BRAND}12`, color: BRAND, border: `1px solid ${BRAND}25` }}
        >
          {vlivers.length}人のタレントが在籍
        </span>
      </div>

      {/* タレント一覧 */}
      <div className="px-4 pt-4">
        <AnimatePresence initial={false}>
          {vlivers.map((vliver, i) => (
            <motion.div
              key={vliver.profileId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
              className="mb-3"
            >
              <VliverCard
                vliver={vliver}
                playingId={playingId}
                likedIds={likedIds}
                onTogglePlay={handleTogglePlay}
                onToggleFavorite={handleToggleFavorite}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VliverCard({
  vliver, playingId, likedIds, onTogglePlay, onToggleFavorite,
}: {
  vliver: AgencyVliver;
  playingId: string | null;
  likedIds: Set<string>;
  onTogglePlay: (v: AgencyVoice) => void;
  onToggleFavorite: (voiceId: string) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      {/* 上部：画像 + プロフィール */}
      <div className="flex">
        <div style={{ width: 3, flexShrink: 0, background: BRAND }} />
        <div className="w-20 h-28 flex-shrink-0 relative" style={{ background: '#FFF5F8' }}>
          <img
            src={vliver.imageUrl || undefined}
            alt={vliver.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
            draggable={false}
          />
        </div>
        <div className="flex-1 px-3 py-2.5 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <h2 className="font-black text-[15px] leading-tight truncate flex-1" style={{ color: '#111111' }}>
                {vliver.name}
              </h2>
              {vliver.voices.some((v) => v.is_boosted) && (
                <span
                  className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: BOOST, color: '#7A5F00' }}
                >
                  <Zap className="w-2 h-2" style={{ fill: '#7A5F00', color: '#7A5F00' }} />
                  BOOST
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono truncate mb-1.5" style={{ color: '#AAAAAA' }}>
              {vliver.handle}
            </p>
            <div className="flex flex-wrap gap-1">
              {vliver.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${BRAND}12`, color: BRAND, border: `1px solid ${BRAND}25` }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* プラットフォームリンク */}
          {(vliver.twitterHandle || Object.keys(vliver.platformLinks ?? {}).length > 0) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {vliver.twitterHandle && (
                <a
                  href={`https://x.com/${vliver.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                  style={{ background: '#000000', color: '#FFFFFF' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {PLATFORMS.filter((p) => vliver.platformLinks?.[p.id]).map((p) => (
                <a
                  key={p.id}
                  href={vliver.platformLinks[p.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                  style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}30` }}
                >
                  {p.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 下部：ボイスリスト */}
      <div style={{ borderTop: '1px solid #F0F0F0' }}>
        {vliver.voices.map((voice) => {
          const isPlaying = playingId === voice.id;
          const isFaved   = likedIds.has(voice.id);
          return (
            <div
              key={voice.id}
              className="px-4 py-2.5"
              style={{ borderBottom: '1px solid #F8F8F8' }}
            >
              <p className="text-xs leading-snug line-clamp-2 mb-2" style={{ color: '#555555' }}>
                「{voice.catchphrase}」
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTogglePlay(voice)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                  style={
                    isPlaying
                      ? { background: BRAND, color: '#fff', boxShadow: `0 2px 8px ${BRAND}40` }
                      : { background: `${BRAND}12`, color: BRAND, border: `1px solid ${BRAND}25` }
                  }
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-2.5 h-2.5 fill-current" />
                      停止
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
                      <Play className="w-2.5 h-2.5 fill-current" />
                      試聴
                    </>
                  )}
                </button>
                <button
                  onClick={() => onToggleFavorite(voice.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                  style={
                    isFaved
                      ? { background: `${BRAND}12`, color: BRAND, border: `1px solid ${BRAND}25` }
                      : { background: '#FFFFFF', color: '#AAAAAA', border: '1px solid #E8E8E8' }
                  }
                >
                  <Heart className="w-2.5 h-2.5" style={{ fill: isFaved ? BRAND : 'none', color: isFaved ? BRAND : '#AAAAAA' }} />
                  {isFaved ? 'お気に入り済み' : 'お気に入り'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgencySkeleton() {
  return (
    <div className="w-full max-w-[430px] mx-auto pb-16 animate-pulse">
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl" style={{ background: '#F0F0F0' }} />
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-28 rounded-full" style={{ background: '#F0F0F0' }} />
            <div className="h-3 w-20 rounded-full" style={{ background: '#F5F5F5' }} />
          </div>
        </div>
        <div className="h-3 w-full rounded-full mb-1.5" style={{ background: '#F5F5F5' }} />
        <div className="h-3 w-3/4 rounded-full mb-3" style={{ background: '#F5F5F5' }} />
        <div className="h-6 w-32 rounded-full" style={{ background: '#F0F0F0' }} />
      </div>
      <div className="px-4 pt-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E8E8' }}>
            <div className="flex">
              <div style={{ width: 3, background: '#F0F0F0' }} />
              <div className="w-20 h-28 flex-shrink-0" style={{ background: '#F5F5F5' }} />
              <div className="flex-1 px-3 py-2.5 flex flex-col gap-2">
                <div className="h-4 w-24 rounded-full" style={{ background: '#F0F0F0' }} />
                <div className="h-3 w-16 rounded-full" style={{ background: '#F5F5F5' }} />
                <div className="flex gap-1">
                  <div className="h-4 w-10 rounded-full" style={{ background: '#F0F0F0' }} />
                  <div className="h-4 w-10 rounded-full" style={{ background: '#F0F0F0' }} />
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5" style={{ borderTop: '1px solid #F0F0F0' }}>
              <div className="h-3 w-full rounded-full mb-2" style={{ background: '#F5F5F5' }} />
              <div className="h-6 w-20 rounded-full" style={{ background: '#F0F0F0' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
