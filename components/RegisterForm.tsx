'use client';

import { useState, useRef, useCallback, useEffect, type ChangeEvent, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Upload, X, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { PLATFORMS } from '@/lib/platforms';
import { createClient } from '@/lib/supabase/client';
import { useMyProfile } from '@/hooks/useMyProfile';

const BRAND = '#EF5285';

const STEPS = ['基本情報', '立ち絵アップロード', 'スタイル設定', '確認 & 登録'] as const;

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

const RIGHTS_ITEMS = [
  { id: 'own_rights'    as const, text: 'アップロードする画像の著作権・肖像権が、自分または所属事務所に帰属していることを確認しました' },
  { id: 'no_third_party' as const, text: '第三者が権利を保有する素材（版権キャラクター等）を無断で使用していません' },
  { id: 'terms'         as const, text: 'V-Vibe 利用規約およびコンテンツガイドラインに同意します' },
] as const;
type RightId = typeof RIGHTS_ITEMS[number]['id'];

const MAX_IMAGE_MB = 10;

interface FormState {
  name: string; handle: string; description: string;
  twitterHandle: string;
  platformLinks: Record<string, string>;
  imageFile: File | null; imagePreview: string;
  color: string; tags: string[];
}
const INIT: FormState = {
  name: '', handle: '', description: '',
  twitterHandle: '',
  platformLinks: {},
  imageFile: null, imagePreview: '', color: '#FF6B9D', tags: [],
};

// ── インライン スタイル定数 ──
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

export default function RegisterForm() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useMyProfile();
  const isEditMode = !!profile;

  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState<FormState>(INIT);
  const [rights, setRights] = useState<Record<RightId, boolean>>({ own_rights: false, no_third_party: false, terms: false });
  const [imageError, setImageError]   = useState('');
  const [imageDragOver, setImageDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const [done, setDone] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 編集モード: プロフィールが読み込まれたらフォームに反映
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name,
      handle: profile.handle,
      description: profile.description,
      twitterHandle: profile.twitter_handle ?? '',
      platformLinks: profile.platform_links ?? {},
      imageFile: null,
      imagePreview: profile.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vlivers-images/${profile.image_path}`
        : '',
      color: profile.color,
      tags: profile.tags,
    });
  }, [profile]);

  useEffect(() => () => { if (form.imagePreview) URL.revokeObjectURL(form.imagePreview); }, []);

  const handleImageFile = useCallback(async (file: File) => {
    setImageError('');
    if (!file.type.startsWith('image/')) { setImageError('画像ファイル（JPG, PNG, WEBP）を選択してください'); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setImageError(`${MAX_IMAGE_MB}MB以内のファイルを選択してください`); return; }
    if (form.imagePreview) URL.revokeObjectURL(form.imagePreview);
    setForm((p) => ({ ...p, imageFile: file, imagePreview: URL.createObjectURL(file) }));
  }, [form.imagePreview]);

  const toggleTag = useCallback((tag: string) => {
    setForm((p) => {
      if (p.tags.includes(tag)) return { ...p, tags: p.tags.filter((t) => t !== tag) };
      if (p.tags.length >= 3) return p;
      return { ...p, tags: [...p.tags, tag] };
    });
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return !!form.name.trim() && !!form.description.trim() && form.description.length <= 100;
      // 編集時は既存画像があればOK
      case 1: return (!!form.imageFile || (isEditMode && !!profile?.image_path)) && !imageError;
      case 2: return true;
      case 3: return RIGHTS_ITEMS.every((r) => rights[r.id]);
      default: return false;
    }
  }, [step, form, imageError, rights, isEditMode, profile]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?next=/register'); return; }

    try {
      let imagePath = profile?.image_path ?? null;
      if (form.imageFile) {
        const ext = form.imageFile.name.split('.').pop() ?? 'jpg';
        imagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('vlivers-images').upload(imagePath, form.imageFile);
        if (error) throw error;
      }

      if (isEditMode && profile) {
        const { error } = await supabase.from('vliver_profiles').update({
          name: form.name, handle: form.handle,
          description: form.description,
          twitter_handle: form.twitterHandle,
          platform_links: form.platformLinks,
          tags: form.tags, color: form.color, image_path: imagePath,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vliver_profiles').insert({
          owner_id: user.id, name: form.name, handle: form.handle,
          description: form.description,
          twitter_handle: form.twitterHandle,
          platform_links: form.platformLinks,
          tags: form.tags, color: form.color, image_path: imagePath,
        });
        if (error) throw error;
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      setSubmitError(isEditMode ? '更新に失敗しました。もう一度お試しください。' : '登録に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 読み込み中 ──
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 rounded-full border-2 border-[#EF5285]/40 border-t-[#EF5285] animate-spin" />
      </div>
    );
  }

  // ── 完了画面 ──
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: '#EF5285', boxShadow: '0 8px 40px #EF528540' }}>
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: '#111111' }}>
            {isEditMode ? 'プロフィールを更新しました！' : 'Vライバー登録完了！'}
          </h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: '#555555' }}>
            {isEditMode
              ? 'プロフィールが更新されました ✨'
              : 'プロフィールが作成されました。\nさっそくボイスを投稿しましょう ✨'}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-[220px]">
          <Link href="/post"
            className="flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm text-white hover:scale-105 transition-transform"
            style={{ background: '#EF5285', boxShadow: '0 4px 16px #EF528540' }}>
            ボイスを投稿する
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
    <div className="w-full max-w-[430px] mx-auto px-4 pb-12">
      {/* プログレス */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full h-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? BRAND : '#E8E8E8' }} />
            <span className="text-[9px] font-bold text-center leading-tight transition-colors duration-300"
              style={{ color: i === step ? BRAND : '#AAAAAA' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 0 */}
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="text-[#111111] text-lg font-black">{isEditMode ? 'プロフィールを編集' : 'あなたのプロフィール'}</h2>
          <Field label="名前" required>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="星咲 あかり" maxLength={30} className={inputCls} />
          </Field>
          <Field label="ハンドル名">
            <div className={`${inputCls} flex items-center`}>
              <span className="text-[#AAAAAA] text-sm mr-1">@</span>
              <input type="text" value={form.handle}
                onChange={(e) => setForm((p) => ({ ...p, handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                placeholder="akari_hoshizaki" maxLength={20}
                className="flex-1 bg-transparent text-[#111111] placeholder-[#AAAAAA] text-sm focus:outline-none" />
            </div>
          </Field>
          <Field label="X（Twitter）ハンドル">
            <div className={`${inputCls} flex items-center`}>
              <span className="text-[#AAAAAA] text-sm mr-1">@</span>
              <input type="text" value={form.twitterHandle}
                onChange={(e) => setForm((p) => ({ ...p, twitterHandle: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                placeholder="akari_hoshizaki" maxLength={50}
                className="flex-1 bg-transparent text-[#111111] placeholder-[#AAAAAA] text-sm focus:outline-none" />
            </div>
          </Field>
          {/* 配信プラットフォームリンク */}
          <div>
            <label className={labelCls}>
              配信プラットフォームリンク <span className="text-[#AAAAAA] font-normal normal-case">（任意）</span>
            </label>

            {/* 追加済みプラットフォーム */}
            <div className="space-y-2 mt-2">
              {PLATFORMS.filter((p) => p.id in form.platformLinks).map((p) => (
                <div key={p.id} className={`${inputCls} flex items-center gap-2 py-2`}>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}30` }}
                  >
                    {p.label}
                  </span>
                  <input
                    type="url"
                    value={form.platformLinks[p.id]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, platformLinks: { ...prev.platformLinks, [p.id]: e.target.value } }))
                    }
                    placeholder={p.placeholder}
                    className="flex-1 bg-transparent text-[#111111] placeholder-[#AAAAAA] text-xs focus:outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => {
                        const next = { ...prev.platformLinks };
                        delete next[p.id];
                        return { ...prev, platformLinks: next };
                      })
                    }
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#F0F0F0]"
                  >
                    <X className="w-3 h-3 text-[#AAAAAA]" />
                  </button>
                </div>
              ))}
            </div>

            {/* プラットフォーム追加セレクト */}
            {PLATFORMS.some((p) => !(p.id in form.platformLinks)) && (
              <PlatformDropdown
                platforms={PLATFORMS.filter((p) => !(p.id in form.platformLinks))}
                onSelect={(id) =>
                  setForm((prev) => ({ ...prev, platformLinks: { ...prev.platformLinks, [id]: '' } }))
                }
              />
            )}
          </div>

          <Field label="自己紹介" required counter={{ current: form.description.length, max: 100 }}>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="ゲーム実況とお歌が得意な天然系VTuber。毎日夜10時から配信中！" rows={3}
              className={`${inputCls} resize-none ${form.description.length > 100 ? 'border-rose-500/60' : ''}`} />
          </Field>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-[#111111] text-lg font-black">立ち絵をアップロード</h2>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>立ち絵画像 <span className="text-rose-400">*</span></label>
              <span className="text-[#AAAAAA] text-xs">JPG/PNG/WEBP・{MAX_IMAGE_MB}MB以内</span>
            </div>
            <div
              className={`relative rounded-2xl border-2 border-dashed overflow-hidden transition-colors ${
                imageDragOver ? 'border-[#EF5285]/40 bg-[#EF5285]/05'
                : form.imagePreview ? 'border-[#E8E8E8]'
                : 'border-[#E8E8E8] hover:border-[#EF5285]/40'
              }`}
              style={{ height: form.imagePreview ? '280px' : '160px' }}
              onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
              onDragLeave={() => setImageDragOver(false)}
              onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setImageDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
            >
              {form.imagePreview ? (
                <>
                  <img src={form.imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button onClick={() => setForm((p) => ({ ...p, imageFile: null, imagePreview: '' }))}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              ) : (
                <button onClick={() => imageInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 w-full">
                  <Upload className="w-8 h-8 text-[#AAAAAA]" />
                  <span className="text-[#AAAAAA] text-sm">タップまたはドロップ</span>
                </button>
              )}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
            {!form.imagePreview && (
              <button onClick={() => imageInputRef.current?.click()}
                className="mt-2 w-full py-2.5 rounded-xl border border-[#E8E8E8] text-[#555555] text-sm font-medium hover:bg-[#F9F9F9] transition-colors">
                画像ファイルを選択
              </button>
            )}
            {imageError && (
              <div className="mt-2 flex items-center gap-1.5 text-rose-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{imageError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-7">
          <h2 className="text-[#111111] text-lg font-black">カードのスタイル</h2>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls}>テーマカラー</label>
              <span className="text-xs font-semibold" style={{ color: form.color }}>
                {PRESET_COLORS.find((c) => c.hex === form.color)?.name}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map(({ hex, name }) => (
                <button key={hex} onClick={() => setForm((p) => ({ ...p, color: hex }))}
                  className="aspect-square rounded-2xl relative transition-transform hover:scale-105 active:scale-95"
                  style={{ background: hex, boxShadow: form.color === hex ? `0 0 0 3px #fff4, 0 0 16px ${hex}88` : 'none' }}
                  aria-label={name}>
                  {form.color === hex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls}>タグ <span className="text-[#AAAAAA] font-normal normal-case">（最大3つ）</span></label>
              <span className="text-xs text-[#AAAAAA]">{form.tags.length}/3</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => {
                const selected = form.tags.includes(tag);
                const disabled = !selected && form.tags.length >= 3;
                return (
                  <button key={tag} onClick={() => !disabled && toggleTag(tag)} disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${disabled ? 'opacity-25 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    style={selected
                      ? { background: BRAND, color: '#fff' }
                      : { background: '#F9F9F9', color: '#555555', border: '1px solid #E8E8E8' }}>
                    {selected && '✓ '}#{tag}
                  </button>
                );
              })}
            </div>
          </div>
          {/* プレビュー */}
          <div>
            <label className={labelCls}>プレビュー</label>
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-[#E8E8E8] h-52"
              style={{ background: `linear-gradient(165deg, ${form.color}18 0%, #F9F9F9 100%)` }}>
              {form.imagePreview ? (
                <img src={form.imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[#AAAAAA] text-xs">立ち絵がここに表示されます</p>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/95 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
                <p className="text-white font-black text-sm truncate">{form.name || '名前が表示されます'}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {form.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: `${form.color}28`, color: form.color, border: `1px solid ${form.color}45` }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-[#111111] text-lg font-black">確認 & 登録</h2>
          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
            style={{ background: '#FFF9F9', border: '1px solid #E8E8E8' }}>
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-400/80 text-xs leading-relaxed">登録前に以下を必ずご確認ください</p>
          </div>
          <div className="space-y-3">
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
          <button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}
            className="w-full py-4 rounded-2xl font-black text-base text-white transition-all"
            style={canProceed() && !isSubmitting
              ? { background: BRAND, boxShadow: '0 4px 24px #EF528540' }
              : { background: '#E8E8E8', color: '#AAAAAA' }}>
            {isSubmitting ? (isEditMode ? '更新中…' : '登録中…') : canProceed() ? (isEditMode ? 'プロフィールを更新する ✨' : 'Vライバーとして登録する ✨') : '上の項目をすべて確認してください'}
          </button>
        </div>
      )}

      {/* ナビゲーション */}
      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[#E8E8E8] text-[#555555] text-sm font-medium hover:bg-[#F9F9F9] transition-colors">
            <ChevronLeft className="w-4 h-4" />戻る
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={canProceed()
              ? { background: BRAND, boxShadow: '0 4px 16px #EF528540' }
              : { background: '#E8E8E8', color: '#AAAAAA' }}>
            次へ<ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function PlatformDropdown({
  platforms,
  onSelect,
}: {
  platforms: typeof PLATFORMS;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-sm text-[#AAAAAA] focus:outline-none focus:border-[#EF5285] transition-colors"
      >
        <span>＋ プラットフォームを追加…</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#E8E8E8] rounded-xl shadow-lg overflow-hidden">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-[#F9F9F9] transition-colors"
            >
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}30` }}
              >
                {p.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
