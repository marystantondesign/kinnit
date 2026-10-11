// ─── Discoveries ──────────────────────────────────────────────────────────────
//
// A discovery is a friendly observation built ONLY from what the user entered
// themselves and what other people explicitly shared with them (e.g. survey
// answers they chose to share). Discoveries never infer contact frequency,
// read messages, score relationships, or nudge anyone to fill out surveys.

export interface Discovery {
  id: string;
  /** Topic key in config/discoveryTopics (drives the artwork) */
  topic: string;
  /** One clear statement, e.g. "You, John, and Sylvia all enjoy hiking." */
  statement: string;
  /** People the discovery is about; "You" is the user */
  people: string[];
  /** Where it came from, shown on the View all page */
  basis: string;
}

export interface DiscoveryState {
  saved: string[];
  dismissed: string[];
}

/**
 * Storage boundary for discoveries. The prototype uses the local adapter;
 * a backend adapter can implement the same interface later.
 */
export interface DiscoveryAdapter {
  list(): Promise<Discovery[]>;
  getState(): Promise<DiscoveryState>;
  setSaved(id: string, saved: boolean): Promise<DiscoveryState>;
  setDismissed(id: string, dismissed: boolean): Promise<DiscoveryState>;
}
