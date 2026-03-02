'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'oshivox-favorites';

interface FavoritesContextValue {
  likedIds: Set<string>;
  orderedIds: string[];
  hydrated: boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds]           = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const userIdRef               = useRef<string | null>(null);
  const supabaseRef             = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      userIdRef.current = session?.user?.id ?? null;
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      /* localStorage 読み取り失敗時は初期値のまま */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, hydrated]);

  const addFavorite = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    const userId = userIdRef.current;
    const supabase = supabaseRef.current;
    if (userId && supabase) {
      supabase.from('favorites').upsert({ user_id: userId, post_id: id }).then(({ error }) => {
        if (error) console.error('favorites insert:', error);
      });
    }
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setIds((prev) => prev.filter((i) => i !== id));
    const userId = userIdRef.current;
    const supabase = supabaseRef.current;
    if (userId && supabase) {
      supabase.from('favorites').delete().eq('user_id', userId).eq('post_id', id).then(({ error }) => {
        if (error) console.error('favorites delete:', error);
      });
    }
  }, []);

  return (
    <FavoritesContext.Provider value={{
      likedIds: new Set(ids),
      orderedIds: ids,
      hydrated,
      addFavorite,
      removeFavorite,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
