export interface InjectResult {
  className: string;
  dispose: () => void;
}

export type DisposeFunction = () => void;

export interface StyleInjectorConfig {
  nonce?: string;
  maxRulesPerSheet?: number; // default: infinite (no cap)
  cacheSize?: number; // default: 500 (LRU of disposed rulesets)
  cleanupDelay?: number; // default: 5000ms (delay before actual DOM cleanup, ignored if idleCleanup is true)
  idleCleanup?: boolean; // default: true (use requestIdleCallback for cleanup when available)
  collectMetrics?: boolean; // default: false (performance tracking)
  forceTextInjection?: boolean; // default: auto-detected (true in test environments, false otherwise)
}

export interface RuleInfo {
  className: string;
  ruleIndex: number;
  sheetIndex: number;
  cssText: string[];
  /** Inclusive end index of the contiguous block of inserted rules for this className */
  endRuleIndex?: number;
}

export interface SheetInfo {
  sheet: HTMLStyleElement;
  ruleCount: number;
  holes: number[]; // Available rule indices from deletions
}

export interface DisposedRuleInfo {
  ruleInfo: RuleInfo;
  disposedAt: number; // timestamp
  recentlyUsed: boolean; // optimization flag
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  disposedHits: number; // hits from disposed cache
  evictions: number;
  totalInsertions: number;
  totalDisposals: number;
  domCleanups: number; // actual DOM rule removals
  startTime: number;
}

export interface RootRegistry {
  sheets: SheetInfo[];
  refCounts: Map<string, number>; // className -> refCount
  rules: Map<string, RuleInfo>; // className -> rule info
  deletionQueue: string[]; // className queue for cleanup
  /** Deduplication set of fully materialized CSS rules inserted into sheets */
  ruleTextSet: Set<string>;
  /** LRU cache for disposed rulesets that can be quickly reused */
  disposedCache: import('../parser/lru').Lru<string, DisposedRuleInfo>;
  /** Cleanup timeouts for lazy disposal */
  cleanupTimeouts: Map<
    string,
    ReturnType<typeof requestIdleCallback> | ReturnType<typeof setTimeout>
  >;
  /** Performance metrics (optional) */
  metrics?: CacheMetrics;
  /** Counter for generating sequential class names like t0, t1, t2... */
  classCounter: number;
}

export interface FlattenedRule {
  selector: string;
  declarations: string;
  atRules?: string[]; // e.g. ['@media (min-width: 768px)', '@supports (display: grid)']
}

export interface KeyframesInfo {
  name: string;
  sheetIndex: number;
  ruleIndex: number;
  cssText: string;
}
