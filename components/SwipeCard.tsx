'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { Play, Pause, Zap } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// 型定義
// is_boosted: 将来の Stripe「優先表示ブースト」課金機能用
// ─────────────────────────────────────────────────────────────
export interface VLiver {
  id: string;
  name: string;
  handle: string;
  catchphrase: string;
  description: string;
  imageUrl: string;
  voiceUrl: string;
  tags: string[];
  color: string;
  is_boosted: boolean;
}

export interface SwipeCardHandle {
  swipeTo: (direction: 'left' | 'right') => void;
}

interface Props {
  vliver: VLiver;
  onSwipe: (direction: 'left' | 'right') => void;
  onAudioPlay?: (audio: HTMLAudioElement) => void;
}

const SWIPE_THRESHOLD = 100;

const SwipeCard = forwardRef<SwipeCardHandle, Props>(
  ({ vliver, onSwipe, onAudioPlay }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const x           = useMotionValue(0);
    const rotate      = useTransform(x, [-220, 220], [-18, 18]);
    const likeOpacity = useTransform(x, [40, 130], [0, 1]);
    const passOpacity = useTransform(x, [-130, -40], [1, 0]);

    const stopAudio = useCallback(() => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }, []);

    const triggerSwipe = useCallback(
      (direction: 'left' | 'right') => {
        stopAudio();
        animate(x, direction === 'right' ? 640 : -640, {
          duration: 0.32,
          ease: [0.4, 0, 0.2, 1],
        });
        setTimeout(() => onSwipe(direction), 280);
      },
      [x, onSwipe, stopAudio],
    );

    useImperativeHandle(ref, () => ({ swipeTo: triggerSwipe }), [triggerSwipe]);

    const handleDragEnd = useCallback(
      (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > SWIPE_THRESHOLD) {
          triggerSwipe('right');
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          triggerSwipe('left');
        } else {
          animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
        }
      },
      [x, triggerSwipe],
    );

    const toggleAudio = useCallback(() => {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        onAudioPlay?.(audioRef.current);
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, [isPlaying, onAudioPlay]);

    return (
      <>
        {/*
          preload="none": ページロード時の不要な通信を防止
          ボイスは15秒以内想定。カード切替時に強制停止。
        */}
        <audio
          ref={audioRef}
          src={vliver.voiceUrl || undefined}
          preload="none"
          onEnded={() => setIsPlaying(false)}
        />

        <motion.div
          className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.65}
          onDragEnd={handleDragEnd}
        >
          {/* ── カード本体 ── */}
          <div
            className="relative w-full h-full rounded-3xl overflow-hidden"
            style={{
              /*
                温かいパープル基調のカード背景。
                各Vライバーのテーマカラーが上部に滲み出る。
              */
              background: `linear-gradient(165deg, ${vliver.color}32 0%, #1e1140 50%, #16093a 100%)`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,181,253,0.10)`,
            }}
          >
            {/* 立ち絵 */}
            <img
              src={vliver.imageUrl}
              alt={vliver.name}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            {/* 上部フェード（バッジ可読性） */}
            <div
              className="absolute top-0 inset-x-0 h-32"
              style={{ background: 'linear-gradient(to bottom, rgba(19,9,43,0.7) 0%, transparent 100%)' }}
            />

            {/* 下部フェード（テキスト可読性） */}
            <div
              className="absolute bottom-0 inset-x-0 h-60"
              style={{ background: 'linear-gradient(to top, rgba(22,9,58,0.97) 0%, rgba(22,9,58,0.7) 50%, transparent 100%)' }}
            />

            {/* ── BOOSTバッジ ── */}
            {vliver.is_boosted && (
              <div
                className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #fde68a, #f59e0b)',
                  color: '#78350f',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                }}
              >
                <Zap className="w-3 h-3 fill-amber-800" />
                BOOST
              </div>
            )}


            {/* ── LIKE スタンプ（右スワイプ中） ── */}
            <motion.div
              className="absolute top-12 right-5 rounded-xl px-3 py-1 -rotate-[18deg]"
              style={{
                opacity: likeOpacity,
                border: '3px solid #86efac',
              }}
            >
              <span className="font-black text-2xl tracking-widest" style={{ color: '#86efac' }}>
                LIKE!
              </span>
            </motion.div>

            {/* ── PASS スタンプ（左スワイプ中） ── */}
            <motion.div
              className="absolute top-12 left-5 rounded-xl px-3 py-1 rotate-[18deg]"
              style={{
                opacity: passOpacity,
                border: '3px solid #fda4af',
              }}
            >
              <span className="font-black text-2xl tracking-widest" style={{ color: '#fda4af' }}>
                PASS
              </span>
            </motion.div>

            {/* ── ボイス再生ボタン（中央）: voiceUrl がある場合のみ表示 ── */}
            {vliver.voiceUrl && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* 再生中: やわらかく光るリング */}
              {isPlaying && (
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{ inset: '-14px', background: vliver.color, opacity: 0.25 }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <button
                onClick={toggleAudio}
                className="relative w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: `${vliver.color}cc`,
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 0 24px ${vliver.color}66, 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
                aria-label={isPlaying ? 'ボイスを停止' : 'ボイスを再生'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white fill-white" />
                ) : (
                  <Play className="w-7 h-7 text-white fill-white translate-x-0.5" />
                )}
              </button>
            </div>}

            {/* ── 下部情報エリア ── */}
            <div className="absolute bottom-0 inset-x-0 p-5 pointer-events-none">
              <h2 className="font-black text-2xl tracking-tight leading-tight" style={{ color: '#faf5ff' }}>
                {vliver.name}
              </h2>
              <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'rgba(250,245,255,0.38)' }}>
                {vliver.handle}
              </p>
              <p className="text-sm mt-2 font-medium leading-relaxed" style={{ color: 'rgba(250,245,255,0.85)' }}>
                「{vliver.catchphrase}」
              </p>

              {/* タグ */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {vliver.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{
                      background: `${vliver.color}22`,
                      color: vliver.color,
                      border: `1px solid ${vliver.color}50`,
                      /* タグにほんのりインナーシャドウで立体感 */
                      boxShadow: `inset 0 1px 0 ${vliver.color}30`,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </>
    );
  },
);

SwipeCard.displayName = 'SwipeCard';
export default SwipeCard;
