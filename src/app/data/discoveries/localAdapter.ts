import { SAMPLE_DISCOVERIES } from "./sampleDiscoveries";
import type { DiscoveryAdapter, DiscoveryState } from "./types";

// Prototype adapter: sample discoveries + saved/dismissed ids in localStorage.
// Swap for a backend adapter that implements DiscoveryAdapter.

const KEY = "kinnit_discoveries_state";
const EMPTY: DiscoveryState = { saved: [], dismissed: [] };

function read(): DiscoveryState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<DiscoveryState>;
      return { saved: s.saved ?? [], dismissed: s.dismissed ?? [] };
    }
  } catch {}
  return EMPTY;
}

function write(state: DiscoveryState): DiscoveryState {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  return state;
}

const toggle = (list: string[], id: string, on: boolean) =>
  on ? (list.includes(id) ? list : [...list, id]) : list.filter((x) => x !== id);

export const localDiscoveryAdapter: DiscoveryAdapter = {
  async list() {
    return SAMPLE_DISCOVERIES;
  },
  async getState() {
    return read();
  },
  async setSaved(id, saved) {
    const s = read();
    return write({ ...s, saved: toggle(s.saved, id, saved) });
  },
  async setDismissed(id, dismissed) {
    const s = read();
    return write({ ...s, dismissed: toggle(s.dismissed, id, dismissed) });
  },
};
