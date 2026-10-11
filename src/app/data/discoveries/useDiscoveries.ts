import { useCallback, useEffect, useState } from "react";
import { localDiscoveryAdapter } from "./localAdapter";
import type { Discovery, DiscoveryAdapter, DiscoveryState } from "./types";

export interface DiscoveriesApi {
  loading: boolean;
  error: boolean;
  all: Discovery[];
  /** Not dismissed */
  eligible: Discovery[];
  state: DiscoveryState;
  isSaved: (id: string) => boolean;
  setSaved: (id: string, saved: boolean) => void;
  setDismissed: (id: string, dismissed: boolean) => void;
}

export function useDiscoveries(adapter: DiscoveryAdapter = localDiscoveryAdapter): DiscoveriesApi {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [all, setAll] = useState<Discovery[]>([]);
  const [state, setState] = useState<DiscoveryState>({ saved: [], dismissed: [] });

  useEffect(() => {
    let live = true;
    Promise.all([adapter.list(), adapter.getState()])
      .then(([list, s]) => {
        if (!live) return;
        setAll(list);
        setState(s);
      })
      .catch(() => live && setError(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [adapter]);

  const setSaved = useCallback(
    (id: string, saved: boolean) => {
      // Optimistic update, then reconcile with the adapter.
      setState((s) => ({ ...s, saved: saved ? [...new Set([...s.saved, id])] : s.saved.filter((x) => x !== id) }));
      adapter.setSaved(id, saved).then(setState).catch(() => {});
    },
    [adapter],
  );

  const setDismissed = useCallback(
    (id: string, dismissed: boolean) => {
      setState((s) => ({
        ...s,
        dismissed: dismissed ? [...new Set([...s.dismissed, id])] : s.dismissed.filter((x) => x !== id),
      }));
      adapter.setDismissed(id, dismissed).then(setState).catch(() => {});
    },
    [adapter],
  );

  return {
    loading,
    error,
    all,
    eligible: all.filter((d) => !state.dismissed.includes(d.id)),
    state,
    isSaved: (id) => state.saved.includes(id),
    setSaved,
    setDismissed,
  };
}

/** Picks another eligible discovery, never the current one when alternatives exist. */
export function pickNext(eligible: Discovery[], currentId: string | null, random = Math.random): Discovery | null {
  if (!eligible.length) return null;
  const others = eligible.filter((d) => d.id !== currentId);
  const pool = others.length ? others : eligible;
  return pool[Math.floor(random() * pool.length)];
}
