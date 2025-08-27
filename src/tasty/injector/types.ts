export interface InjectResult {
  className: string;
  dispose: () => void;
}

export type DisposeFunction = () => void;

export interface StyleInjectorConfig {
  nonce?: string;
  maxRulesPerSheet?: number; // default: infinite (no cap)
  unusedStylesThreshold?: number; // default: 500 (threshold for bulk cleanup of unused styles)
  bulkCleanupDelay?: number; // default: 5000ms (delay before bulk cleanup, ignored if idleCleanup is true)
  idleCleanup?: boolean; // default: true (use requestIdleCallback for cleanup when available)
  collectMetrics?: boolean; // default: false (performance tracking)
  forceTextInjection?: boolean; // default: auto-detected (true in test environments, false otherwise)
  /** When false, avoid storing full cssText for each rule block to reduce memory. */
  debugMode?: boolean; // default: false (store less data)
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

export interface UnusedRuleInfo {
  ruleInfo: RuleInfo;
  markedUnusedAt: number; // timestamp when marked as unused
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  unusedHits: number; // hits from unused styles
  bulkCleanups: number; // number of bulk cleanup operations
  totalInsertions: number;
  totalUnused: number; // total styles marked as unused
  stylesCleanedUp: number; // total number of styles cleaned up in bulk operations
  startTime: number;
}

export interface RootRegistry {
  sheets: SheetInfo[];
  refCounts: Map<string, number>; // className -> refCount
  rules: Map<string, RuleInfo>; // className -> rule info (includes both active and unused)
  unusedRules: Map<string, UnusedRuleInfo>; // className -> unused rule info
  /** Deduplication set of fully materialized CSS rules inserted into sheets */
  ruleTextSet: Set<string>;
  /** Scheduled bulk cleanup timeout */
  bulkCleanupTimeout:
    | ReturnType<typeof requestIdleCallback>
    | ReturnType<typeof setTimeout>
    | null;
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
