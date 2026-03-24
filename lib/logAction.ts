import type { SupabaseClient } from '@supabase/supabase-js';

export type ActionType =
  | 'voice_play'
  | 'page_view'
  | 'favorite_add'
  | 'favorite_remove';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'oshivox-session-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** fire-and-forget でアクションを action_logs テーブルに記録する */
export function logAction(
  supabase: SupabaseClient,
  userId: string | null,
  action: ActionType,
  extras?: { postId?: string; pagePath?: string },
): void {
  supabase
    .from('action_logs')
    .insert({
      user_id:    userId ?? null,
      session_id: getSessionId(),
      action,
      post_id:    extras?.postId   ?? null,
      page_path:  extras?.pagePath ?? null,
    })
    .then(({ error }) => {
      if (error) console.error('logAction:', error);
    });
}
