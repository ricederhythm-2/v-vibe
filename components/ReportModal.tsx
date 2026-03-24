'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const BRAND = '#EF5285';

const REASONS = [
  '不適切なコンテンツ',
  '著作権の侵害',
  'スパム',
  'なりすまし',
  'その他',
];

interface Props {
  vliverId: string;
  vliverName: string;
  onClose: () => void;
}

export default function ReportModal({ vliverId, vliverName, onClose }: Props) {
  const [targetType, setTargetType] = useState<'profile' | 'voice' | null>(null);
  const [reason, setReason]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

  const canSubmit = !!targetType && !!reason && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    await supabase.from('reports').insert({
      reporter_id: user?.id ?? null,
      target_type: targetType,
      target_id:   vliverId,
      reason,
    });
    setDone(true);
    setSubmitting(false);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      {/* 背景オーバーレイ */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.35)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* シート */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[430px] mx-auto rounded-t-3xl px-5 pt-4 pb-10"
        style={{ background: '#FFFFFF', boxShadow: '0 -4px 24px rgba(0,0,0,0.10)' }}
      >
        {/* ハンドル */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#E0E0E0' }} />

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: '#E8F5E9' }}
            >
              <Check className="w-7 h-7 text-emerald-500" strokeWidth={2.5} />
            </div>
            <p className="text-base font-black" style={{ color: '#111111' }}>通報を受け付けました</p>
            <p className="text-xs text-center" style={{ color: '#AAAAAA' }}>
              内容を確認のうえ、適切に対応します
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black" style={{ color: '#111111' }}>通報</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ background: '#F5F5F5' }}
              >
                <X className="w-4 h-4" style={{ color: '#555555' }} />
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: '#AAAAAA' }}>
              「{vliverName}」の何を通報しますか？
            </p>

            {/* 対象選択 */}
            <div className="flex gap-2 mb-5">
              {(['profile', 'voice'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTargetType(type)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] active:scale-95"
                  style={
                    targetType === type
                      ? { background: `${BRAND}12`, color: BRAND, borderColor: `${BRAND}40` }
                      : { background: '#F9F9F9', color: '#555555', borderColor: '#E8E8E8' }
                  }
                >
                  {type === 'profile' ? '🖼️ イラスト' : '🎙️ ボイス'}
                </button>
              ))}
            </div>

            {/* 理由選択 */}
            <p className="text-xs font-semibold mb-2" style={{ color: '#555555' }}>理由</p>
            <div className="space-y-2 mb-6">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs text-left transition-all"
                  style={
                    reason === r
                      ? { background: `${BRAND}08`, borderColor: `${BRAND}40`, color: '#111111' }
                      : { background: '#F9F9F9', borderColor: '#E8E8E8', color: '#555555' }
                  }
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: reason === r ? BRAND : '#CCCCCC' }}
                  >
                    {reason === r && (
                      <div className="w-2 h-2 rounded-full" style={{ background: BRAND }} />
                    )}
                  </div>
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-2xl font-black text-sm transition-all"
              style={
                canSubmit
                  ? { background: BRAND, color: '#FFFFFF', boxShadow: `0 4px 16px ${BRAND}40` }
                  : { background: '#E8E8E8', color: '#AAAAAA' }
              }
            >
              {submitting ? '送信中…' : '通報する'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
