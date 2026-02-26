'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Music,
  X,
  Check,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─────────────────────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────────────────────
const STEPS = ['基本情報', '素材アップロード', 'スタイル設定', '権利確認 & 送信'] as const;

const PRESET_COLORS = [
  { hex: '#FF6B9D', name: 'チェリーピンク' },
  { hex: '#4A90D9', name: 'スカイブルー'   },
  { hex: '#52C788', name: 'ミントグリーン' },
  { hex: '#9B59B6', name: 'パープル'       },
  { hex: '#F39C12', name: 'サンセット'     },
  { hex: '#E74C3C', name: 'クリムゾン'     },
  { hex: '#1ABC9C', name: 'ティール'       },
  { hex: '#F1C40F', name: 'ゴールド'       },
] as const;

const PRESET_TAGS = [
  '歌', 'ゲーム', 'ASMR', '雑談', '朗読', 'ホラー',
  '癒し系', '料理', '天然', 'クール', 'ツンデレ', '元気系',
  '考察', 'ロールプレイ', '歌枠', 'ダーク系',
] as const;

// ⚠️ 権利確認チェックリスト
// 著作権・第三者権利・利用規約の3点をすべて確認させることで
// 「知らなかった」による権利侵害トラブルを未然に防止する
const RIGHTS_ITEMS = [
  {
    id: 'own_rights' as const,
    text: 'アップロードする画像・音声の著作権・肖像権が、自分または所属事務所に帰属していることを確認しました',
  },
  {
    id: 'no_third_party' as const,
    text: '第三者が権利を保有する素材（版権キャラクター・他者制作の楽曲等）を無断で使用していません',
  },
  {
    id: 'terms' as const,
    text: 'V-Vibe 利用規約およびコンテンツガイドライン（配信禁止コンテンツ含む）に同意します',
  },
] as const;

type RightId = typeof RIGHTS_ITEMS[number]['id'];

const MAX_VOICE_SEC = 15;
const MAX_VOICE_MB  = 5;
const MAX_IMAGE_MB  = 10;

// ─────────────────────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────────────────────
const getAudioDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    audio.addEventListener('error', reject);
  });

// ─────────────────────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────────────────────
interface FormState {
  name: string;
  handle: string;
  catchphrase: string;
  description: string;
  imageFile: File | null;
  imagePreview: string;
  voiceFile: File | null;
  voiceObjectUrl: string;
  voiceDuration: number | null;
  color: string;
  tags: string[];
}

const INIT: FormState = {
  name: '', handle: '', catchphrase: '', description: '',
  imageFile: null, imagePreview: '',
  voiceFile: null, voiceObjectUrl: '', voiceDuration: null,
  color: '#FF6B9D', tags: [],
};

// ─────────────────────────────────────────────────────────────
// ミニカードプレビュー（ステップ 2・3 で共用）
// ─────────────────────────────────────────────────────────────
function MiniCardPreview({ form, tall = false }: { form: FormState; tall?: boolean }) {
  return (
    <div
      className={`mt-3 relative rounded-2xl overflow-hidden border border-white/10 ${tall ? 'h-64' : 'h-44'}`}
      style={{ background: `linear-gradient(165deg, ${form.color}18 0%, #0d0d20 100%)` }}
    >
      {form.imagePreview ? (
        <img src={form.imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/15 text-xs">立ち絵がここに表示されます</p>
        </div>
      )}

      {/* 下部フェード */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/95 to-transparent" />

      {/* ダミー再生ボタン */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: `${form.color}CC`, backdropFilter: 'blur(8px)' }}
      >
        <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />
      </div>

      {/* テキスト情報 */}
      <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
        <p className="text-white font-black text-sm leading-tight truncate">
          {form.name || '名前が表示されます'}
        </p>
        {form.catchphrase && (
          <p className="text-white/70 text-[11px] mt-0.5 truncate">「{form.catchphrase}」</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: `${form.color}28`, color: form.color, border: `1px solid ${form.color}45` }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────────────────────
export default function UploadForm() {
  const router = useRouter();

  const [step,      setStep]      = useState(0);
  const [form,      setForm]      = useState<FormState>(INIT);
  const [rights,    setRights]    = useState<Record<RightId, boolean>>({
    own_rights: false, no_third_party: false, terms: false,
  });
  const [imageError,     setImageError]     = useState('');
  const [voiceError,     setVoiceError]     = useState('');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [imageDragOver,  setImageDragOver]  = useState(false);
  const [voiceDragOver,  setVoiceDragOver]  = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [submitError,    setSubmitError]    = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── オブジェクトURLのクリーンアップ ──
  useEffect(() => {
    return () => {
      if (form.imagePreview)   URL.revokeObjectURL(form.imagePreview);
      if (form.voiceObjectUrl) URL.revokeObjectURL(form.voiceObjectUrl);
      voiceAudioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // voiceObjectUrl が変わったら再生中のインスタンスをリセット
  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
      setIsVoicePlaying(false);
    }
  }, [form.voiceObjectUrl]);

  // ── 画像ファイル処理 ──
  const handleImageFile = useCallback(async (file: File) => {
    setImageError('');
    if (!file.type.startsWith('image/')) {
      setImageError('画像ファイル（JPG, PNG, WEBP）を選択してください');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`${MAX_IMAGE_MB}MB以内のファイルを選択してください`);
      return;
    }
    if (form.imagePreview) URL.revokeObjectURL(form.imagePreview);
    const preview = URL.createObjectURL(file);
    setForm((p) => ({ ...p, imageFile: file, imagePreview: preview }));
  }, [form.imagePreview]);

  // ── 音声ファイル処理 ──
  const handleVoiceFile = useCallback(async (file: File) => {
    setVoiceError('');
    const validExt = /\.(mp3|aac|wav|m4a|ogg)$/i;
    if (!file.type.startsWith('audio/') && !validExt.test(file.name)) {
      setVoiceError('MP3, AAC, WAV 形式の音声ファイルを選択してください');
      return;
    }
    if (file.size > MAX_VOICE_MB * 1024 * 1024) {
      setVoiceError(`${MAX_VOICE_MB}MB以内のファイルを選択してください`);
      return;
    }
    try {
      const duration = await getAudioDuration(file);
      if (duration > MAX_VOICE_SEC) {
        setVoiceError(`音声は${MAX_VOICE_SEC}秒以内にしてください（現在: ${Math.round(duration)}秒）`);
        return;
      }
      if (form.voiceObjectUrl) URL.revokeObjectURL(form.voiceObjectUrl);
      const url = URL.createObjectURL(file);
      setForm((p) => ({ ...p, voiceFile: file, voiceObjectUrl: url, voiceDuration: duration }));
    } catch {
      setVoiceError('音声ファイルの読み込みに失敗しました');
    }
  }, [form.voiceObjectUrl]);

  // ── タグトグル（最大3つ） ──
  const toggleTag = useCallback((tag: string) => {
    setForm((p) => {
      if (p.tags.includes(tag)) return { ...p, tags: p.tags.filter((t) => t !== tag) };
      if (p.tags.length >= 3)   return p;
      return { ...p, tags: [...p.tags, tag] };
    });
  }, []);

  // ── 権利チェック ──
  const toggleRight = useCallback((id: RightId) => {
    setRights((p) => ({ ...p, [id]: !p[id] }));
  }, []);

  // ── ステップ通過判定 ──
  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0:
        return (
          !!form.name.trim() &&
          !!form.catchphrase.trim() && form.catchphrase.length <= 20 &&
          !!form.description.trim() && form.description.length <= 100
        );
      case 1: return !!form.imageFile && !imageError && !voiceError;
      case 2: return true; // color に初期値あり、タグは任意
      case 3: return RIGHTS_ITEMS.every((r) => rights[r.id]);
      default: return false;
    }
  }, [step, form, imageError, voiceError, rights]);

  // ── 音声プレイヤートグル ──
  const toggleVoicePlay = useCallback(() => {
    if (!form.voiceObjectUrl) return;
    if (!voiceAudioRef.current) {
      const audio = new Audio(form.voiceObjectUrl);
      // preload="none" に相当: 初回 play() まで読み込まない
      audio.preload = 'none';
      audio.addEventListener('ended', () => setIsVoicePlaying(false));
      voiceAudioRef.current = audio;
    }
    if (isVoicePlaying) {
      voiceAudioRef.current.pause();
      setIsVoicePlaying(false);
    } else {
      voiceAudioRef.current.play().catch(() => {});
      setIsVoicePlaying(true);
    }
  }, [form.voiceObjectUrl, isVoicePlaying]);

  // ── 送信（Supabase Storage + DB） ──
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?next=/upload');
      return;
    }

    try {
      // 画像を Storage にアップロード
      let imagePath: string | null = null;
      if (form.imageFile) {
        const ext = form.imageFile.name.split('.').pop() ?? 'jpg';
        imagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from('vlivers-images')
          .upload(imagePath, form.imageFile);
        if (error) throw error;
      }

      // 音声を Storage にアップロード
      let voicePath: string | null = null;
      if (form.voiceFile) {
        const ext = form.voiceFile.name.split('.').pop() ?? 'mp3';
        voicePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from('vlivers-voices')
          .upload(voicePath, form.voiceFile);
        if (error) throw error;
      }

      // vlivers テーブルに INSERT
      const { error } = await supabase.from('vlivers').insert({
        owner_id:   user.id,
        name:       form.name,
        handle:     form.handle,
        catch_copy: form.catchphrase,
        description: form.description,
        tags:       form.tags,
        color:      form.color,
        image_path: imagePath,
        voice_path: voicePath,
      });
      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      console.error('upload error:', err);
      setSubmitError('投稿に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 送信完了画面
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-2"
          style={{ background: 'linear-gradient(135deg, #52C788, #1ABC9C)', boxShadow: '0 8px 40px rgba(82,199,136,0.4)' }}
        >
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: '#faf5ff' }}>投稿が完了しました！</h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(196,181,253,0.55)' }}>
            あなたのカードがすぐにスワイプ画面に表示されます。<br />
            たくさんのファンに出会えますように ✨
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
        >
          スワイプ画面に戻る
        </Link>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // フォーム本体
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="w-full max-w-[430px] mx-auto px-4 pb-12">

      {/* ── プログレスインジケーター ── */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full h-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? form.color : '#1d1040' }}
            />
            <span
              className="text-[9px] font-bold transition-colors duration-300 text-center leading-tight"
              style={{ color: i === step ? form.color : 'rgba(196,181,253,0.25)' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ━━━ STEP 0: 基本情報 ━━━ */}
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="text-white text-lg font-black">あなたのプロフィール</h2>

          <Field label="名前" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="星咲 あかり"
              maxLength={30}
              className={inputCls}
            />
          </Field>

          <Field label="ハンドル名">
            <div className={`${inputCls} flex items-center`}>
              <span className="text-white/30 text-sm mr-1">@</span>
              <input
                type="text"
                value={form.handle}
                onChange={(e) => setForm((p) => ({ ...p, handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                placeholder="akari_hoshizaki"
                maxLength={20}
                className="flex-1 bg-transparent text-white placeholder-white/20 text-sm focus:outline-none"
              />
            </div>
          </Field>

          <Field
            label="キャッチコピー"
            required
            counter={{ current: form.catchphrase.length, max: 20 }}
            hint="カード下部に大きく表示されます"
          >
            <input
              type="text"
              value={form.catchphrase}
              onChange={(e) => setForm((p) => ({ ...p, catchphrase: e.target.value }))}
              placeholder="今日も一緒に輝こうね⭐"
              className={`${inputCls} ${form.catchphrase.length > 20 ? 'border-rose-500/60' : ''}`}
            />
          </Field>

          <Field
            label="自己紹介"
            required
            counter={{ current: form.description.length, max: 100 }}
          >
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="ゲーム実況とお歌が得意な天然系VTuber。毎日夜10時から配信中！"
              rows={3}
              className={`${inputCls} resize-none ${form.description.length > 100 ? 'border-rose-500/60' : ''}`}
            />
          </Field>

        </div>
      )}

      {/* ━━━ STEP 1: 素材アップロード ━━━ */}
      {step === 1 && (
        <div className="space-y-7">
          <h2 className="text-white text-lg font-black">素材をアップロード</h2>

          {/* ── 立ち絵画像 ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>
                立ち絵画像 <span className="text-rose-400">*</span>
              </label>
              <span className="text-white/25 text-xs">JPG/PNG/WEBP・{MAX_IMAGE_MB}MB以内</span>
            </div>

            <div
              className={`relative rounded-2xl border-2 border-dashed overflow-hidden transition-colors ${
                imageDragOver
                  ? 'border-white/40 bg-white/10'
                  : form.imagePreview
                  ? 'border-white/10'
                  : 'border-[rgba(196,181,253,0.15)] hover:border-[rgba(196,181,253,0.28)]'
              }`}
              style={{ height: form.imagePreview ? '260px' : '140px' }}
              onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
              onDragLeave={() => setImageDragOver(false)}
              onDrop={(e: DragEvent<HTMLDivElement>) => {
                e.preventDefault(); setImageDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleImageFile(f);
              }}
            >
              {form.imagePreview ? (
                <>
                  <img src={form.imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setForm((p) => ({ ...p, imageFile: null, imagePreview: '' }))}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 w-full"
                >
                  <Upload className="w-8 h-8 text-white/30" />
                  <span className="text-white/40 text-sm">タップまたはドロップ</span>
                </button>
              )}
            </div>

            <input
              ref={imageInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0]; if (f) handleImageFile(f);
              }}
            />
            {!form.imagePreview && (
              <button onClick={() => imageInputRef.current?.click()} className={selectBtnCls}>
                画像ファイルを選択
              </button>
            )}
            <ErrorMsg msg={imageError} />
          </div>

          {/* ── 自己PR音声 ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>
                自己PR音声
                <span className="text-white/30 font-normal normal-case ml-1">（任意・{MAX_VOICE_SEC}秒以内）</span>
              </label>
              <span className="text-white/25 text-xs">MP3/AAC/WAV・{MAX_VOICE_MB}MB以内</span>
            </div>

            {form.voiceFile ? (
              /* ── 再生プレイヤー ── */
              <div
                className="flex items-center gap-3 rounded-2xl border border-white/10 p-3.5"
                style={{ background: `${form.color}12` }}
              >
                <button
                  onClick={toggleVoicePlay}
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
                  style={{ background: form.color }}
                >
                  {isVoicePlaying
                    ? <Pause className="w-5 h-5 text-white fill-white" />
                    : <Play  className="w-5 h-5 text-white fill-white translate-x-0.5" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{form.voiceFile.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {form.voiceDuration ? `${Math.round(form.voiceDuration)}秒` : ''}
                    {' '}・ {(form.voiceFile.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
                <button
                  onClick={() => {
                    voiceAudioRef.current?.pause();
                    voiceAudioRef.current = null;
                    setIsVoicePlaying(false);
                    setForm((p) => ({ ...p, voiceFile: null, voiceObjectUrl: '', voiceDuration: null }));
                  }}
                  className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-3 h-3 text-white/60" />
                </button>
              </div>
            ) : (
              /* ── ドロップゾーン ── */
              <div
                className={`rounded-2xl border-2 border-dashed h-20 flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  voiceDragOver ? 'border-white/40 bg-white/10' : 'border-[rgba(196,181,253,0.15)] hover:border-[rgba(196,181,253,0.28)]'
                }`}
                onDragOver={(e) => { e.preventDefault(); setVoiceDragOver(true); }}
                onDragLeave={() => setVoiceDragOver(false)}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault(); setVoiceDragOver(false);
                  const f = e.dataTransfer.files[0]; if (f) handleVoiceFile(f);
                }}
              >
                <Music className="w-6 h-6 text-white/25" />
                <span className="text-white/35 text-xs">タップまたはドロップ</span>
              </div>
            )}

            <input
              ref={voiceInputRef} type="file" accept="audio/*" className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0]; if (f) handleVoiceFile(f);
              }}
            />
            {!form.voiceFile && (
              <button onClick={() => voiceInputRef.current?.click()} className={selectBtnCls}>
                音声ファイルを選択
              </button>
            )}
            <ErrorMsg msg={voiceError} />

            {/* 注意書き */}
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-400/80 text-xs leading-relaxed">
                ボイスは自分で収録したもののみ使用可。BGMに市販・版権楽曲を使用するとアカウント停止対象となります。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ STEP 2: スタイル設定 ━━━ */}
      {step === 2 && (
        <div className="space-y-7">
          <h2 className="text-white text-lg font-black">カードのスタイル</h2>

          {/* テーマカラー */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls}>テーマカラー</label>
              <span className="text-xs font-semibold" style={{ color: form.color }}>
                {PRESET_COLORS.find((c) => c.hex === form.color)?.name}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map(({ hex, name }) => (
                <button
                  key={hex}
                  onClick={() => setForm((p) => ({ ...p, color: hex }))}
                  className="aspect-square rounded-2xl relative transition-transform hover:scale-105 active:scale-95"
                  style={{ background: hex, boxShadow: form.color === hex ? `0 0 0 3px #fff4, 0 0 16px ${hex}88` : 'none' }}
                  aria-label={name}
                >
                  {form.color === hex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* タグ選択 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls}>
                タグ <span className="text-white/30 font-normal normal-case">（最大3つ）</span>
              </label>
              <span className="text-xs text-white/30">{form.tags.length}/3</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => {
                const selected = form.tags.includes(tag);
                const disabled = !selected && form.tags.length >= 3;
                return (
                  <button
                    key={tag}
                    onClick={() => !disabled && toggleTag(tag)}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      disabled ? 'opacity-25 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                    }`}
                    style={
                      selected
                        ? { background: form.color, color: '#fff' }
                        : { background: `${form.color}16`, color: form.color, border: `1px solid ${form.color}40` }
                    }
                  >
                    {selected && '✓ '}#{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* プレビュー */}
          <div>
            <label className={labelCls}>カードプレビュー</label>
            <MiniCardPreview form={form} />
          </div>
        </div>
      )}

      {/* ━━━ STEP 3: 権利確認 & 送信 ━━━ */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-white text-lg font-black">権利確認 & 送信</h2>

          {/* カードプレビュー（大） */}
          <div>
            <label className={labelCls}>最終プレビュー</label>
            <MiniCardPreview form={form} tall />
          </div>

          {/* ⚠️ 権利確認チェックリスト ── ここが最重要セクション ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-400 text-xs font-bold">投稿前に以下を必ずご確認ください</p>
            </div>

            <div className="space-y-3">
              {RIGHTS_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleRight(item.id)}
                  className={`w-full flex items-start gap-3 rounded-2xl p-3.5 border text-left transition-all ${
                    rights[item.id]
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-[rgba(196,181,253,0.12)] bg-[rgba(196,181,253,0.02)] hover:border-[rgba(196,181,253,0.2)]'
                  }`}
                >
                  {/* チェックボックス */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      rights[item.id] ? 'bg-emerald-500' : 'bg-white/10'
                    }`}
                  >
                    {rights[item.id] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>

                  {/* ラベルテキスト */}
                  <span className={`text-xs leading-relaxed transition-colors ${
                    rights[item.id] ? 'text-white/85' : 'text-white/45'
                  }`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>

            {/* チェック進捗 */}
            <p className="mt-2 text-right text-xs text-white/30">
              {Object.values(rights).filter(Boolean).length}/{RIGHTS_ITEMS.length} 確認済み
            </p>
          </div>

          {/* エラー表示 */}
          {submitError && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)', color: 'rgba(253,164,175,0.9)' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="w-full py-4 rounded-2xl font-black text-base text-white transition-all"
            style={
              canProceed() && !isSubmitting
                ? { background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }
                : { background: '#1d1040', color: 'rgba(196,181,253,0.25)' }
            }
          >
            {isSubmitting ? 'アップロード中…' : canProceed() ? '今すぐ投稿する ✨' : '上の項目をすべて確認してください'}
          </button>
        </div>
      )}

      {/* ── ナビゲーション ── */}
      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[rgba(196,181,253,0.18)] text-[rgba(196,181,253,0.55)] text-sm font-medium hover:bg-[rgba(196,181,253,0.06)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            戻る
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={
              canProceed()
                ? { background: form.color, boxShadow: `0 4px 16px ${form.color}55` }
                : { background: '#1d1040', color: 'rgba(196,181,253,0.25)' }
            }
          >
            次へ
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 共通スタイル定数 & 小コンポーネント
// ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-[rgba(196,181,253,0.06)] border border-[rgba(196,181,253,0.14)] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[rgba(196,181,253,0.35)] transition-colors';

const labelCls =
  'block text-[rgba(196,181,253,0.55)] text-xs font-semibold uppercase tracking-wider';

const selectBtnCls =
  'mt-2 w-full py-2.5 rounded-xl border border-[rgba(196,181,253,0.18)] text-[rgba(196,181,253,0.55)] text-sm font-medium hover:bg-[rgba(196,181,253,0.06)] transition-colors';

function Field({
  label, required = false, optional = false, hint, counter, children,
}: {
  label: string; required?: boolean; optional?: boolean;
  hint?: string; counter?: { current: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelCls}>
          {label}{' '}
          {required && <span className="text-rose-400">*</span>}
          {optional && <span className="text-[rgba(196,181,253,0.3)] font-normal normal-case">（任意）</span>}
        </label>
        {counter && (
          <span className={`text-xs ${counter.current > counter.max ? 'text-rose-400' : 'text-white/30'}`}>
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1 text-white/25 text-xs">{hint}</p>}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="mt-2 flex items-center gap-1.5 text-rose-400 text-xs">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {msg}
    </div>
  );
}
