'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Pencil, Trash2, Check, X, Mic, ArrowRight, Heart } from 'lucide-react';
import { useMyPosts, type VoicePost } from '@/hooks/useMyPosts';

const BRAND = '#EF5285';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function voiceUrl(voice_path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/vlivers-voices/${voice_path}`;
}

export default function MyPostsList() {
  const { posts, loading, deletePost, updateCatchCopy } = useMyPosts();

  const currentAudioRef           = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleTogglePlay = useCallback(
    (post: VoicePost) => {
      if (playingId === post.id) {
        currentAudioRef.current?.pause();
        setPlayingId(null);
        return;
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      const audio = new Audio(voiceUrl(post.voice_path));
      audio.preload = 'none';
      audio.addEventListener('ended', () => setPlayingId(null));
      audio.play().catch(() => {});
      currentAudioRef.current = audio;
      setPlayingId(post.id);
    },
    [playingId],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (playingId === id) {
        currentAudioRef.current?.pause();
        currentAudioRef.current = null;
        setPlayingId(null);
      }
      deletePost(id);
    },
    [playingId, deletePost],
  );

  if (loading) return null;
  if (posts.length === 0) return <EmptyState />;

  return (
    <div className="w-full max-w-[430px] mx-auto px-4 pt-4 pb-12">
      <p className="text-right text-xs mb-2" style={{ color: '#AAAAAA' }}>
        {posts.length}件の投稿
      </p>

      <AnimatePresence initial={false}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isPlaying={playingId === post.id}
            onTogglePlay={() => handleTogglePlay(post)}
            onDelete={() => handleDelete(post.id)}
            onUpdateCatchCopy={(text) => updateCatchCopy(post.id, text)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function PostCard({
  post,
  isPlaying,
  onTogglePlay,
  onDelete,
  onUpdateCatchCopy,
}: {
  post: VoicePost;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onDelete: () => void;
  onUpdateCatchCopy: (text: string) => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(post.catch_copy);

  const handleSave = () => {
    if (draft.trim()) onUpdateCatchCopy(draft.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(post.catch_copy);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const dateLabel = new Date(post.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

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
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div className="flex">
          {/* 左アクセントライン */}
          <div style={{ width: 3, flexShrink: 0, background: BRAND }} />

          {/* コンテンツエリア */}
          <div className="flex-1 px-3 py-3 min-w-0">
            {/* 投稿日 + いいね数 */}
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px]" style={{ color: '#AAAAAA' }}>
                {dateLabel}
                {!post.is_published && (
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: '#FFF3CD', color: '#856404' }}
                  >
                    非公開
                  </span>
                )}
              </p>
              <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: BRAND }}>
                <Heart className="w-3 h-3 fill-current" />
                {post.like_count}
              </span>
            </div>

            {/* キャッチコピー */}
            {editing ? (
              <div className="flex items-center gap-1.5 mb-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={60}
                  className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border outline-none min-w-0"
                  style={{
                    borderColor: BRAND,
                    color: '#111111',
                    boxShadow: `0 0 0 2px ${BRAND}20`,
                  }}
                />
                <button
                  onClick={handleSave}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
                  style={{ background: BRAND }}
                  aria-label="保存"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={handleCancel}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
                  style={{ background: '#F0F0F0' }}
                  aria-label="キャンセル"
                >
                  <X className="w-3.5 h-3.5" style={{ color: '#555555' }} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setDraft(post.catch_copy); setEditing(true); }}
                className="flex items-center gap-1.5 mb-2 group text-left w-full"
                aria-label="キャッチコピーを編集"
              >
                <p className="text-sm leading-snug flex-1" style={{ color: '#111111' }}>
                  「{post.catch_copy}」
                </p>
                <Pencil
                  className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#AAAAAA' }}
                />
              </button>
            )}

            {/* ボタン行 */}
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
                style={
                  isPlaying
                    ? { background: BRAND, color: '#fff', boxShadow: `0 2px 8px ${BRAND}40` }
                    : { background: `${BRAND}12`, color: BRAND, border: `1px solid ${BRAND}25` }
                }
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
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
                    <Play className="w-3 h-3 fill-current" />
                    再生
                  </>
                )}
              </button>

              <button
                onClick={onDelete}
                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all active:scale-95 hover:scale-105"
                style={{ color: '#AAAAAA', border: '1px solid #E8E8E8', background: '#FFFFFF' }}
                aria-label="投稿を削除"
              >
                <Trash2 className="w-3 h-3" />
                削除
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-6">
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: `${BRAND}10`, border: `1.5px solid ${BRAND}20` }}
      >
        <Mic className="w-9 h-9" style={{ color: `${BRAND}60` }} />
      </motion.div>

      <div>
        <h2 className="text-xl font-black" style={{ color: '#111111' }}>
          まだ投稿がありません
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: '#555555' }}>
          ボイスを投稿して<br />リスナーに届けましょう
        </p>
      </div>

      <Link
        href="/post"
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
        style={{ background: BRAND, boxShadow: `0 4px 16px ${BRAND}40` }}
      >
        ボイスを投稿する
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
