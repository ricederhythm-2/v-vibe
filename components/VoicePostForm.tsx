'use client';

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, X, Check, AlertCircle, Mic, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMyProfile } from '@/hooks/useMyProfile';

const BRAND = '#EF5285';

const RIGHTS_ITEMS = [
  { id: 'own_voice'   as const, text: 'アップロードする音声の著作権が、自分または所属事務所に帰属していることを確認しました' },
  { id: 'no_bgm'     as const, text: '無断使用の BGM・SE・第三者の声を含んでいません' },
  { id: 'terms'      as const, text: 'OshiVox 利用規約およびコンテンツガイドラインに同意します' },
] as const;
type RightId = typeof RIGHTS_ITEMS[number]['id'];

const MAX_VOICE_MB  = 20;
const MAX_VOICE_SEC = 15;

const inputCls = 'w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#111111] placeholder-[#AAAAAA] text-sm focus:outline-none focus:border-[#EF5285] transition-colors';
const labelCls = 'block text-[#555555] text-xs font-semibold uppercase tracking-wider';

function Field({ label, required = false, counter, children }: {
  label: string; required?: boolean; counter?: { current: number; max: number }; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelCls}>{label}{required && <span className="text-rose-400 ml-1">*</span>}</label>
        {counter && (
          <span className={`text-xs ${counter.current > counter.max ? 'text-rose-400' : 'text-[#AAAAAA]'}`}>
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

    const url = URL.createObjectURL(file);
    const audio = new window.Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      if (audio.duration > MAX_VOICE_SEC) {
        setVoiceError(`${MAX_VOICE_SEC}秒以内の音声ファイルを選択してください（現在: ${Math.ceil(audio.duration)}秒）`);
        return;
      }
      setVoiceFile(file);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      setVoiceError('音声ファイルを読み込めませんでした。別のファイルをお試しください');
    });
  }, []);

  const canSubmit = !!catchCopy.trim() && catchCopy.length <= 60 && !!voiceFile && !voiceError && RIGHTS_ITEMS.every((r) => rights[r.id]);

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
        <div className="w-6 h-6 rounded-full border-2 border-[#EF5285]/40 border-t-[#EF5285] animate-spin" />
      </div>
    );
  }

  // ── プロフィール未登録 ──
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: '#F9F9F9', border: '2px solid #E8E8E8' }}>
          <User className="w-9 h-9" style={{ color: '#AAAAAA' }} />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#111111]">まずVライバー登録を</h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: '#555555' }}>
            ボイスを投稿するには、<br />先にVライバープロフィールの登録が必要です。
          </p>
        </div>
        <Link href="/register"
          className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-white hover:scale-105 transition-transform"
          style={{ background: BRAND, boxShadow: '0 4px 16px #EF528540' }}>
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
          style={{ background: '#EF5285', boxShadow: '0 8px 40px #EF528540' }}>
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: '#111111' }}>ボイス投稿完了！</h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: '#555555' }}>
            スワイプ画面に反映されました ✨<br />続けてもう1枚投稿もできます。
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-[220px]">
          <button
            onClick={() => { setCatchCopy(''); setVoiceFile(null); setRights({ own_voice: false, no_bgm: false, terms: false }); setDone(false); }}
            className="flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm text-white hover:scale-105 transition-transform"
            style={{ background: BRAND, boxShadow: '0 4px 16px #EF528540' }}>
            もう1枚投稿する
          </button>
          <Link href="/my-posts"
            className="py-3 rounded-full font-bold text-sm text-center transition-all hover:scale-105"
            style={{ color: BRAND, border: `1px solid ${BRAND}40`, background: `${BRAND}08` }}>
            投稿一覧を見る
          </Link>
          <Link href="/"
            className="py-3 rounded-full font-bold text-sm text-center transition-all hover:scale-105"
            style={{ color: '#555555', border: '1px solid #E8E8E8', background: '#F9F9F9' }}>
            スワイプ画面を見る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[430px] mx-auto px-4 pb-12 space-y-5">

      {/* プロフィールカード */}
      <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
        style={{ background: '#F9F9F9', border: '1px solid #E8E8E8' }}>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#F0F0F0]">
          {profile.image_path && (
            <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vlivers-images/${profile.image_path}`}
              alt={profile.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[#111111] text-sm font-bold truncate">{profile.name}</p>
          {profile.handle && <p className="text-[#AAAAAA] text-xs">@{profile.handle}</p>}
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{ background: `${BRAND}20`, color: BRAND, border: `1px solid ${BRAND}40` }}>
            Vライバー
          </span>
        </div>
      </div>

      {/* キャッチコピー */}
      <Field label="キャッチコピー" required counter={{ current: catchCopy.length, max: 60 }}>
        <textarea
          value={catchCopy}
          onChange={(e) => setCatchCopy(e.target.value)}
          placeholder="今夜も深夜に遊びにきてね♪ 一緒に癒しの時間を過ごそう"
          rows={3}
          className={`${inputCls} resize-none ${catchCopy.length > 60 ? 'border-rose-500/60' : ''}`}
        />
        <p className="mt-1 text-[#AAAAAA] text-[11px]">
          スワイプ画面でカードに表示されるひと言です
        </p>
      </Field>

      {/* ボイスファイル */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>ボイスファイル <span className="text-rose-400">*</span></label>
          <span className="text-[#AAAAAA] text-xs">MP3/M4A/WAV・{MAX_VOICE_SEC}秒・{MAX_VOICE_MB}MB以内</span>
        </div>
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-8 ${
            voiceDragOver ? 'border-[#EF5285]/40 bg-[#EF5285]/05'
            : voiceFile ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-[#E8E8E8] hover:border-[#EF5285]/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setVoiceDragOver(true); }}
          onDragLeave={() => setVoiceDragOver(false)}
          onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setVoiceDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleVoiceFile(f); }}
        >
          {voiceFile ? (
            <>
              <Mic className="w-8 h-8 text-emerald-400" />
              <div className="text-center">
                <p className="text-emerald-600 text-sm font-semibold">{voiceFile.name}</p>
                <p className="text-[#AAAAAA] text-xs mt-0.5">{(voiceFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button
                onClick={() => setVoiceFile(null)}
                className="flex items-center gap-1 text-[#AAAAAA] text-xs hover:text-[#555555] transition-colors">
                <X className="w-3.5 h-3.5" />変更する
              </button>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[#AAAAAA]" />
              <p className="text-[#AAAAAA] text-sm">タップまたはドロップ</p>
              <button
                onClick={() => voiceInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-[#E8E8E8] text-[#555555] text-sm font-medium hover:bg-[#F9F9F9] transition-colors">
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
          style={{ background: '#FFF9F9', border: '1px solid #E8E8E8' }}>
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-400/80 text-xs leading-relaxed">投稿前に以下を必ずご確認ください</p>
        </div>
        {RIGHTS_ITEMS.map((item) => (
          <button key={item.id} onClick={() => setRights((p) => ({ ...p, [item.id]: !p[item.id] }))}
            className={`w-full flex items-start gap-3 rounded-2xl p-3.5 border text-left transition-all ${rights[item.id] ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-[#E8E8E8] bg-[#F9F9F9] hover:border-[#EF5285]/30'}`}>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${rights[item.id] ? 'bg-emerald-500' : 'bg-[#E8E8E8]'}`}>
              {rights[item.id] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <span className={`text-xs leading-relaxed ${rights[item.id] ? 'text-[#111111]' : 'text-[#555555]'}`}>{item.text}</span>
          </button>
        ))}
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
          style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)', color: 'rgba(253,164,175,0.9)' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{submitError}
        </div>
      )}

      <button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}
        className="w-full py-4 rounded-2xl font-black text-base text-white transition-all"
        style={canSubmit && !isSubmitting
          ? { background: BRAND, boxShadow: '0 4px 24px #EF528540' }
          : { background: '#E8E8E8', color: '#AAAAAA' }}>
        {isSubmitting ? 'アップロード中…' : canSubmit ? 'ボイスを投稿する ✨' : 'すべての項目を入力してください'}
      </button>
    </div>
  );
}
