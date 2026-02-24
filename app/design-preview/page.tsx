'use client';

/**
 * デザイントンマナ確認ページ
 * URL: /design-preview
 *
 * 原則:
 * - ブランドカラー 1色（#EF5285）に絞る
 * - 背景・テキスト・ボーダーはニュートラルグレー系
 * - #FEEE7D は BOOST バッジ専用のセマンティックカラー
 * - タグは全てブランドカラー単色（濃度違いで表現）
 */

import { Heart, Mic, UserPlus, Sparkles, Play, X, RotateCcw, Zap, Check } from 'lucide-react';

// ─── パレット ─────────────────────────────────────────────────────
// ブランドカラー 1色 + ニュートラル で構成
const C = {
  brand:   '#EF5285',   // 唯一のブランドカラー。CTAボタン・アイコン・アクティブ状態に使う
  boost:   '#FEEE7D',   // BOOST バッジ専用。それ以外には使わない
  bg:      '#FFFFFF',
  surface: '#FFFFFF',
  card:    '#FFFFFF',
  divider: '#F0F0F0',   // ニュートラルグレー
  border:  '#E8E8E8',   // ニュートラルグレー（ブランド色を乗せない）
  t1:      '#111111',   // 見出し
  t2:      '#555555',   // サブテキスト
  t3:      '#AAAAAA',   // ヒント・補足
};

export default function DesignPreviewPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100dvh', fontFamily: 'sans-serif' }}>

      {/* ページタイトル */}
      <div style={{ borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 20, borderRadius: 4, background: C.brand }} />
          <div>
            <p style={{ margin: 0, fontSize: 10, color: C.t3, letterSpacing: 1 }}>DESIGN PREVIEW</p>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.t1 }}>V-Vibe — ライト & フラット</h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* ━━━ カラーパレット ━━━ */}
        <Section title="Color Palette">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { hex: C.brand,   label: 'Brand',   dark: true  },
              { hex: C.boost,   label: 'Boost',   dark: false },
              { hex: C.border,  label: 'Border',  dark: false },
              { hex: C.divider, label: 'Divider', dark: false },
              { hex: C.t1,      label: 'Text / 1', dark: true },
              { hex: C.t2,      label: 'Text / 2', dark: true },
              { hex: C.t3,      label: 'Text / 3', dark: false },
            ].map(({ hex, label, dark }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: hex,
                  border: `1px solid ${C.border}`,
                }} />
                <span style={{ fontSize: 9, color: C.t3, textAlign: 'center' }}>
                  {label}<br />{hex}
                </span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 11, color: C.t3, lineHeight: 1.6 }}>
            ブランドカラーはCTA・アイコン・アクティブ状態のみ。<br />
            ボーダー・テキストはニュートラルグレーに統一。
          </p>
        </Section>

        {/* ━━━ ヘッダー ━━━ */}
        <Section title="Header">
          <div style={{
            background: C.surface,
            borderBottom: `1px solid ${C.divider}`,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color={C.brand} />
              <span style={{ fontWeight: 900, fontSize: 18, color: C.t1, letterSpacing: '-0.5px' }}>V-Vibe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <GhostBtn>
                <Heart size={16} color={C.brand} fill={C.brand} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.brand }}>3</span>
              </GhostBtn>
              <GhostBtn><UserPlus size={16} color={C.t2} /></GhostBtn>
              <GhostBtn><Mic size={16} color={C.t2} /></GhostBtn>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: C.brand,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>Y</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ━━━ スワイプカード ━━━ */}
        <Section title="Swipe Card">
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            {/* 立ち絵エリア */}
            <div style={{
              height: 260,
              background: '#FFF5F8',   // brand の極薄版、単発で使用
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {/* BOOST バッジ（boost カラー専用） */}
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: C.boost,
                borderRadius: 999,
                padding: '3px 8px',
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: 10, fontWeight: 900, color: '#7A5F00',
              }}>
                <Zap size={10} color="#7A5F00" fill="#7A5F00" />
                BOOST
              </div>

              {/* 再生ボタン */}
              <button style={{
                width: 56, height: 56, borderRadius: '50%',
                background: C.brand,
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${C.brand}40`,
              }}>
                <Play size={22} color="#fff" fill="#fff" />
              </button>

              {/* LIKE スタンプ */}
              <div style={{
                position: 'absolute', top: 16, left: 14,
                border: `2.5px solid ${C.brand}`,
                borderRadius: 6, padding: '2px 10px',
                transform: 'rotate(-15deg)', opacity: 0.55,
              }}>
                <span style={{ fontWeight: 900, fontSize: 18, color: C.brand, letterSpacing: 2 }}>LIKE!</span>
              </div>
            </div>

            {/* 情報エリア */}
            <div style={{ padding: '16px 18px 20px' }}>
              <h2 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 900, color: C.t1 }}>星咲 あかり</h2>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: C.t3, fontFamily: 'monospace' }}>@akari_hoshizaki</p>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: C.t2, lineHeight: 1.6 }}>
                「今夜も一緒に盛り上がろ！ゲーム実況と歌でお届け ✨」
              </p>
              {/* タグ：ブランドカラー単色、濃度で変化させない */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['歌', 'ゲーム', '天然'].map((tag) => (
                  <span key={tag} style={{
                    fontSize: 12, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 999,
                    background: `${C.brand}12`,
                    color: C.brand,
                    border: `1px solid ${C.brand}25`,
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 24 }}>
            <button style={{
              width: 52, height: 52, borderRadius: '50%',
              background: C.surface, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <X size={20} color={C.t3} />
            </button>
            <button style={{
              width: 64, height: 64, borderRadius: '50%',
              background: C.brand, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: `0 4px 20px ${C.brand}40`,
            }}>
              <Heart size={26} color="#fff" fill="#fff" />
            </button>
          </div>
        </Section>

        {/* ━━━ レコメンドバッジ ━━━ */}
        <Section title="Recommend Badge">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Badge icon={<Sparkles size={12} color={C.brand} />} color={C.brand}>
              あなたが好きな <strong>#歌</strong> タグ
            </Badge>
            <Badge icon={<Sparkles size={12} color={C.t2} />} color={C.t2}>
              似た趣味のユーザーに人気
            </Badge>
          </div>
        </Section>

        {/* ━━━ お気に入りカード ━━━ */}
        <Section title="Favorites Card">
          {[
            { name: '星咲 あかり', handle: '@akari_hoshizaki', tags: ['歌', 'ゲーム'], boosted: true  },
            { name: '翠葉 みどり', handle: '@midori_suiha',   tags: ['癒し', 'ASMR'], boosted: false },
          ].map((v) => (
            <div key={v.name} style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              display: 'flex',
              overflow: 'hidden',
              marginBottom: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              {/* 左アクセントライン */}
              <div style={{ width: 3, flexShrink: 0, background: C.brand }} />
              {/* 画像プレースホルダー */}
              <div style={{
                width: 68, flexShrink: 0,
                background: '#FFF5F8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 26 }}>🎤</span>
              </div>
              {/* テキスト */}
              <div style={{ flex: 1, padding: '12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontWeight: 900, fontSize: 15, color: C.t1 }}>{v.name}</span>
                  {v.boosted && (
                    <span style={{
                      fontSize: 9, fontWeight: 900,
                      background: C.boost, color: '#7A5F00',
                      padding: '1px 6px', borderRadius: 999,
                      display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                      <Zap size={8} color="#7A5F00" fill="#7A5F00" />BOOST
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: C.t3, fontFamily: 'monospace' }}>{v.handle}</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {v.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 999,
                      background: `${C.brand}12`, color: C.brand,
                      border: `1px solid ${C.brand}25`,
                    }}>#{tag}</span>
                  ))}
                </div>
              </div>
              {/* 試聴ボタン */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                <button style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${C.brand}12`,
                  border: `1px solid ${C.brand}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Play size={13} color={C.brand} fill={C.brand} />
                </button>
              </div>
            </div>
          ))}
        </Section>

        {/* ━━━ ボタン ━━━ */}
        <Section title="Buttons">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* プライマリ */}
            <button style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: C.brand, color: '#fff',
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 2px 10px ${C.brand}35`,
            }}>
              Vライバーとして登録する ✨
            </button>
            {/* セカンダリ */}
            <button style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: C.surface, color: C.brand,
              border: `1.5px solid ${C.brand}`,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
            }}>
              ボイスを投稿する
            </button>
            {/* ゴースト */}
            <button style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: C.surface, color: C.t2,
              border: `1px solid ${C.border}`,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <RotateCcw size={14} color={C.t2} />もう一度見る
            </button>
          </div>
        </Section>

        {/* ━━━ フォーム ━━━ */}
        <Section title="Form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.t2, marginBottom: 6 }}>名前 *</label>
              <input readOnly defaultValue="星咲 あかり" style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${C.brand}`,
                fontSize: 14, color: C.t1, background: C.surface,
                outline: 'none',
              }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.t2, marginBottom: 6 }}>自己紹介</label>
              <textarea readOnly defaultValue="ゲーム実況とお歌が得意な天然系VTuber。毎日夜10時から配信中！" rows={2} style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`,
                fontSize: 14, color: C.t1, background: C.surface,
                resize: 'none', outline: 'none',
              }} />
            </div>
          </div>
        </Section>

        {/* ━━━ 全員完了 ━━━ */}
        <Section title="All Done State">
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '36px 24px',
            textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: `${C.brand}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Heart size={30} color={C.brand} fill={C.brand} />
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: C.t1 }}>全員チェック完了！</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: C.t2 }}>3人のVライバーをお気に入りに追加しました</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 220, margin: '0 auto' }}>
              <button style={{
                padding: '13px', borderRadius: 12, border: 'none',
                background: C.brand, color: '#fff',
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Heart size={14} color="#fff" fill="#fff" />お気に入りを見る
              </button>
              <button style={{
                padding: '13px', borderRadius: 12,
                background: C.surface, color: C.t2,
                border: `1px solid ${C.border}`,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <RotateCcw size={14} color={C.t2} />もう一度見る
              </button>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}

// ─── 小コンポーネント ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#AAAAAA' }}>
        {title.toUpperCase()}
      </p>
      {children}
    </section>
  );
}

function GhostBtn({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      height: 32, borderRadius: 999,
      padding: '0 10px',
      background: 'transparent',
      border: `1px solid #E8E8E8`,
      display: 'flex', alignItems: 'center', gap: 4,
      cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

function Badge({ children, icon, color }: { children: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 999,
      background: `${color}0D`,
      border: `1px solid ${color}20`,
      width: 'fit-content',
      fontSize: 12, fontWeight: 600, color,
    }}>
      {icon}{children}
    </div>
  );
}
