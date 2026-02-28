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

const BRAND  = '#EF5285';
const BOOST  = '#FEEE7D';

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
  twitterHandle: string;
  platformLinks: Record<string, string>;
}

export interface SwipeCardHandle {
  swipeTo: (direction: 'left' | 'right') => void;
}

interface Props {
  vliver: VLiver;
  onSwipe: (direction: 'left' | 'right') => void;
  onAudioPlay?: (audio: HTMLAudioElement) => void;
  recommendBadge?: React.ReactNode;
}

const SWIPE_THRESHOLD = 100;

const SwipeCard = forwardRef<SwipeCardHandle, Props>(
  ({ vliver, onSwipe, onAudioPlay, recommendBadge }, ref) => {
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
          <div
            className="relative w-full h-full rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #E8E8E8',
            }}
          >
            {/* 立ち絵エリア（残りを全て埋める） */}
            <div className="relative flex-1" style={{ background: '#FFF5F8' }}>
              <img
                src={vliver.imageUrl || undefined}
                alt={vliver.name}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />

              {/* BOOST バッジ */}
              {vliver.is_boosted && (
                <div
                  className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full"
                  style={{
                    background: BOOST,
                    color: '#7A5F00',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  }}
                >
                  <Zap className="w-3 h-3" style={{ fill: '#7A5F00', color: '#7A5F00' }} />
                  BOOST
                </div>
              )}

              {/* LIKE スタンプ */}
              <motion.div
                className="absolute top-12 right-5 rounded-xl px-3 py-1 -rotate-[18deg]"
                style={{ opacity: likeOpacity, border: `3px solid ${BRAND}` }}
              >
                <span className="font-black text-2xl tracking-widest" style={{ color: BRAND }}>
                  LIKE!
                </span>
              </motion.div>

              {/* PASS スタンプ */}
              <motion.div
                className="absolute top-12 left-5 rounded-xl px-3 py-1 rotate-[18deg]"
                style={{ opacity: passOpacity, border: '3px solid #AAAAAA' }}
              >
                <span className="font-black text-2xl tracking-widest" style={{ color: '#AAAAAA' }}>
                  PASS
                </span>
              </motion.div>

              {/* 再生ボタン（下境界にかぶせる） */}
              {vliver.voiceUrl && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                  {isPlaying && (
                    <motion.div
                      className="absolute rounded-full pointer-events-none"
                      style={{ inset: '-14px', background: BRAND, opacity: 0.15 }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <button
                    onClick={toggleAudio}
                    className="relative w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    style={{
                      background: BRAND,
                      boxShadow: `0 4px 16px ${BRAND}50`,
                      border: '3px solid #fff',
                    }}
                    aria-label={isPlaying ? 'ボイスを停止' : 'ボイスを再生'}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white fill-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white fill-white translate-x-0.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 下部情報エリア（コンテンツ高さのみ） */}
            <div
              className="flex-shrink-0 px-5 pt-4 pb-4"
              style={{ borderTop: '1px solid #F0F0F0' }}
            >
              {recommendBadge && (
                <div className="mb-2">{recommendBadge}</div>
              )}
              <h2 className="font-black text-[20px] tracking-tight leading-tight" style={{ color: '#111111' }}>
                {vliver.name}
              </h2>
              <p className="text-xs font-mono mt-0.5" style={{ color: '#AAAAAA' }}>
                {vliver.handle}
              </p>
              {vliver.description && (
                <p className="text-xs mt-1.5 leading-relaxed line-clamp-3" style={{ color: '#555555' }}>
                  {vliver.description}
                </p>
              )}

              {/* タグ */}
              <div className="flex flex-wrap gap-1 mt-2">
                {vliver.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: `${BRAND}12`,
                      color: BRAND,
                      border: `1px solid ${BRAND}25`,
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
