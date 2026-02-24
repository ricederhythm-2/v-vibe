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
            className="relative w-full h-full rounded-3xl overflow-hidden"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #E8E8E8',
            }}
          >
            {/* 立ち絵エリア（上60%） */}
            <div
              className="absolute inset-x-0 top-0"
              style={{ height: '62%', background: '#FFF5F8' }}
            >
              <img
                src={vliver.imageUrl}
                alt={vliver.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>

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

            {/* 再生ボタン（立ち絵中央） */}
            {vliver.voiceUrl && (
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: 'calc(62% - 32px)' }}
              >
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

            {/* 下部情報エリア */}
            <div
              className="absolute bottom-0 inset-x-0 px-5 pt-4 pb-5"
              style={{
                top: '62%',
                background: '#FFFFFF',
                borderTop: '1px solid #F0F0F0',
              }}
            >
              <h2 className="font-black text-[22px] tracking-tight leading-tight" style={{ color: '#111111' }}>
                {vliver.name}
              </h2>
              <p className="text-xs font-mono mt-0.5" style={{ color: '#AAAAAA' }}>
                {vliver.handle}
              </p>
              <p className="text-sm mt-2 leading-relaxed line-clamp-1" style={{ color: '#555555' }}>
                「{vliver.catchphrase}」
              </p>

              {/* タグ */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {vliver.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
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
