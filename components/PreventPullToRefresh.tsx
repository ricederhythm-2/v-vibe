'use client';

import { useEffect } from 'react';

/**
 * スクロール位置が先頭で下方向にスワイプしたときだけ preventDefault() して
 * pull-to-refresh を抑止する。
 * document がスクロールしないページ（h-dvh + overflow-hidden のスワイプ画面）
 * では scrollHeight ≒ clientHeight になるため介入しない。
 */
export default function PreventPullToRefresh() {
  useEffect(() => {
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const scrollEl = document.scrollingElement as HTMLElement | null;
      if (!scrollEl) return;

      // document にスクロール余地がないページ（ホーム等）は無視
      if (scrollEl.scrollHeight <= scrollEl.clientHeight + 1) return;

      // 先頭で下スワイプ → pull-to-refresh を防ぐ
      if (scrollEl.scrollTop <= 0 && e.touches[0].clientY > startY) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return null;
}
