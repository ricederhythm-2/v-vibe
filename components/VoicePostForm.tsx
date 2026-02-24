'use client';

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Upload, X, Check, AlertCircle, Mic, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMyProfile } from '@/hooks/useMyProfile';

const STEPS = ['投稿内容', 'ボイスアップロード'] as const;

const RIGHTS_ITEMS = [
  { id: 'own_voice'   as const, text: 'アップロードする音声の著作権が、自分または所属事務所に帰属していることを確認しました' },
  { id: 'no_bgm'     as const, text: '無断使用の BGM・SE・第三者の声を含んでいません' },
  { id: 'terms'      as const, text: 'V-Vibe 利用規約およびコンテンツガイドラインに同意します' },
] as const;
type RightId = typeof RIGHTS_ITEMS[number]['id'];

const MAX_VOICE_MB = 20;

const inputCls = 'w-full bg-[rgba(196,181,253,0.06)] border border-[rgba(196,181,253,0.14)] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[rgba(196,181,253,0.35)] transition-colors';
const labelCls = 'block text-[rgba(196,181,253,0.55)] text-xs font-semibold uppercase tracking-wider';

function Field({ label, required = false, counter, children }: {
  label: string; required?: boolean; counter?: { current: number; max: number }; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelCls}>{label}{required && <span className="text-rose-400 ml-1">*</span>}</label>
        {counter && (
          <span className={`text-xs ${counter.current > counter.max ? 'text-rose-400' : 'text-white/30'}`}>
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function VoicePostForm() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useMyProfile();

  const [step, setStep]     = useState(0);
  const [catchCopy, setCatchCopy] = useState('');
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceError, setVoiceError]   = useState('');
  const [voiceDragOver, setVoiceDragOver] = useState(false);
  const [rights, setRights] = useState<Record<RightId, boolean>>({ own_voice: false, no_bgm: false, terms: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [done, setDone] = useState(false);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceFile = useCallback((file: File) => {
    setVoiceError('');
    if (!file.type.startsWith('audio/')) { setVoiceError('音声ファイル（MP3, M4A, WAV, OGG）を選択してください'); return; }
    if (file.size > MAX_VOICE_MB * 1024 * 1024) { setVoiceError(`${MAX_VOICE_MB}MB以内のファイルを選択してください`); return; }
    setVoiceFile(file);
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return !!catchCopy.trim() && catchCopy.length <= 60;
      case 1: return !!voiceFile && !voiceError && RIGHTS_ITEMS.every((r) => rights[r.id]);
      default: return false;
    }
  }, [step, catchCopy, voiceFile, voiceError, rights]);

  const handleSubmit = async () => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?next=/post'); return; }

    try {
      let voicePath: string | null = null;
      if (voiceFile) {
        const ext = voiceFile.name.split('.').pop() ?? 'mp3';
        voicePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('vlivers-voices').upload(voicePath, voiceFile);
        if (error) throw error;
      }
      const { error } = await supabase.from('voice_posts').insert({
        vliver_id: profile.id,
        owner_id:  user.id,
        catch_copy: catchCopy,
        voice_path: voicePath,
        is_published: true,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      console.error(err);
      setSubmitError('投稿に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── プロフィール読み込み中 ──
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 rounded-full border-2 border-fuchsia-400/40 border-t-fuchsia-400 animate-spin" />
      </div>
    );
  }

  // ── プロフィール未登録 ──
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(196,181,253,0.08)', border: '2px solid rgba(196,181,253,0.2)' }}>
          <User className="w-9 h-9" style={{ color: 'rgba(196,181,253,0.5)' }} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">まずVライバー登録を</h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(196,181,253,0.5)' }}>
            ボイスを投稿するには、<br />先にVライバープロフィールの登録が必要です。
          </p>
        </div>
        <Link href="/register"
          className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-white hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
          Vライバー登録へ
        </Link>
      </div>
    );
  }

  // ── 投稿完了画面 ──
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', boxShadow: '0 8px 40px rgba(168,85,247,0.4)' }}>
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: '#faf5ff' }}>ボイス投稿完了！</h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(196,181,253,0.55)' }}>
            スワイプ画面に反映されました ✨<br />続けてもう1枚投稿もできます。
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-[220px]">
          <button
            onClick={() => { setStep(0); setCatchCopy(''); setVoiceFile(null); setRights({ own_voice: false, no_bgm: false, terms: false }); setDone(false); }}
            className="flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm text-white hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
            もう1枚投稿する
          </button>
          <Link href="/"
            className="py-3 rounded-full font-bold text-sm text-center transition-all hover:scale-105"
            style={{ color: 'rgba(196,181,253,0.6)', border: '1px solid rgba(196,181,253,0.2)', background: 'rgba(196,181,253,0.06)' }}>
            スワイプ画面を見る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4 pb-12">
      {/* プログレス */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full h-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? profile.color : '#1d1040' }} />
            <span className="text-[9px] font-bold text-center leading-tight transition-colors duration-300"
              style={{ color: i === step ? profile.color : 'rgba(196,181,253,0.25)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* プロフィールカード */}
      <div className="flex items-center gap-3 mb-6 rounded-2xl px-3 py-2.5"
        style={{ background: 'rgba(196,181,253,0.05)', border: '1px solid rgba(196,181,253,0.12)' }}>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[rgba(196,181,253,0.1)]">
          {profile.image_path && (
            <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vlivers-images/${profile.image_path}`}
              alt={profile.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-bold truncate">{profile.name}</p>
          {profile.handle && <p className="text-[rgba(196,181,253,0.45)] text-xs">@{profile.handle}</p>}
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{ background: `${profile.color}20`, color: profile.color, border: `1px solid ${profile.color}40` }}>
            Vライバー
          </span>
        </div>
      </div>

      {/* STEP 0 */}
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="text-white text-lg font-black">投稿内容</h2>
          <Field label="キャッチコピー" required counter={{ current: catchCopy.length, max: 60 }}>
            <textarea
              value={catchCopy}
              onChange={(e) => setCatchCopy(e.target.value)}
              placeholder="今夜も深夜に遊びにきてね♪ 一緒に癒しの時間を過ごそう"
              rows={3}
              className={`${inputCls} resize-none ${catchCopy.length > 60 ? 'border-rose-500/60' : ''}`}
            />
            <p className="mt-1 text-[rgba(196,181,253,0.35)] text-[11px]">
              スワイプ画面でカードに表示されるひと言です
            </p>
          </Field>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-white text-lg font-black">ボイスをアップロード</h2>

          {/* ドロップゾーン */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>ボイスファイル <span className="text-rose-400">*</span></label>
              <span className="text-white/25 text-xs">MP3/M4A/WAV・{MAX_VOICE_MB}MB以内</span>
            </div>
            <div
              className={`relative rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-8 ${
                voiceDragOver ? 'border-white/40 bg-white/10'
                : voiceFile ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-[rgba(196,181,253,0.15)] hover:border-[rgba(196,181,253,0.28)]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setVoiceDragOver(true); }}
              onDragLeave={() => setVoiceDragOver(false)}
              onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setVoiceDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleVoiceFile(f); }}
            >
              {voiceFile ? (
                <>
                  <Mic className="w-8 h-8 text-emerald-400" />
                  <div className="text-center">
                    <p className="text-emerald-300 text-sm font-semibold">{voiceFile.name}</p>
                    <p className="text-white/35 text-xs mt-0.5">{(voiceFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <button
                    onClick={() => setVoiceFile(null)}
                    className="flex items-center gap-1 text-white/40 text-xs hover:text-white/70 transition-colors">
                    <X className="w-3.5 h-3.5" />変更する
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-white/25" />
                  <p className="text-white/40 text-sm">タップまたはドロップ</p>
                  <button
                    onClick={() => voiceInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl border border-[rgba(196,181,253,0.18)] text-[rgba(196,181,253,0.55)] text-sm font-medium hover:bg-[rgba(196,181,253,0.06)] transition-colors">
                    ファイルを選択
                  </button>
                </>
              )}
            </div>
            <input ref={voiceInputRef} type="file" accept="audio/*" className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleVoiceFile(f); }} />
            {voiceError && (
              <div className="mt-2 flex items-center gap-1.5 text-rose-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{voiceError}
              </div>
            )}
          </div>

          {/* 権利確認チェック */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(196,181,253,0.05)', border: '1px solid rgba(196,181,253,0.12)' }}>
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-400/80 text-xs leading-relaxed">投稿前に以下を必ずご確認ください</p>
            </div>
            {RIGHTS_ITEMS.map((item) => (
              <button key={item.id} onClick={() => setRights((p) => ({ ...p, [item.id]: !p[item.id] }))}
                className={`w-full flex items-start gap-3 rounded-2xl p-3.5 border text-left transition-all ${rights[item.id] ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-[rgba(196,181,253,0.12)] bg-[rgba(196,181,253,0.02)] hover:border-[rgba(196,181,253,0.2)]'}`}>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${rights[item.id] ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  {rights[item.id] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className={`text-xs leading-relaxed ${rights[item.id] ? 'text-white/85' : 'text-white/45'}`}>{item.text}</span>
              </button>
            ))}
          </div>

          {submitError && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)', color: 'rgba(253,164,175,0.9)' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{submitError}
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}
            className="w-full py-4 rounded-2xl font-black text-base text-white transition-all"
            style={canProceed() && !isSubmitting
              ? { background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }
              : { background: '#1d1040', color: 'rgba(196,181,253,0.25)' }}>
            {isSubmitting ? 'アップロード中…' : canProceed() ? 'ボイスを投稿する ✨' : 'ファイルと確認事項をチェックしてください'}
          </button>
        </div>
      )}

      {/* ナビゲーション */}
      {step < STEPS.length - 1 && (
        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[rgba(196,181,253,0.18)] text-[rgba(196,181,253,0.55)] text-sm font-medium hover:bg-[rgba(196,181,253,0.06)] transition-colors">
              <ChevronLeft className="w-4 h-4" />戻る
            </button>
          )}
          <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={canProceed()
              ? { background: profile.color, boxShadow: `0 4px 16px ${profile.color}55` }
              : { background: '#1d1040', color: 'rgba(196,181,253,0.25)' }}>
            次へ<ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step > 0 && step < STEPS.length - 1 && (
        <button onClick={() => setStep((s) => s - 1)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-[rgba(196,181,253,0.18)] text-[rgba(196,181,253,0.55)] text-sm font-medium hover:bg-[rgba(196,181,253,0.06)] transition-colors">
          <ChevronLeft className="w-4 h-4" />戻る
        </button>
      )}
    </div>
  );
}
