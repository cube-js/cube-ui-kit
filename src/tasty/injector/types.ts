export interface InjectResult {
  className: string;
  dispose: () => void;
}

export interface GlobalInjectResult {
  dispose: () => void;
}

export type DisposeFunction = () => void;

export interface StyleInjectorConfig {
  nonce?: string;
  maxRulesPerSheet?: number; // default: infinite (no cap)
  unusedStylesThreshold?: number; // default: 500 (threshold for bulk cleanup of unused styles)
  bulkCleanupDelay?: number; // default: 5000ms (delay before bulk cleanup, ignored if idleCleanup is true)
  idleCleanup?: boolean; // default: true (use requestIdleCallback for cleanup when available)
  forceTextInjection?: boolean; // default: auto-detected (true in test environments, false otherwise)
  /** Enable development mode features: performance metrics and debug information storage */
  devMode?: boolean; // default: auto-detected (true in development, false in production)
  /**
   * Ratio of unused styles to delete per bulk cleanup run (0..1).
   * Defaults to 0.5 (oldest half) to reduce risk of removing styles
   * that may be restored shortly after being marked unused.
   */
  bulkCleanupBatchRatio?: number;
  /**
   * Minimum age (in ms) a style must remain unused before eligible for deletion.
   * Helps avoid races during rapid mount/unmount cycles. Default: 10000ms.
   */
  unusedStylesMinAgeMs?: number;
  /**
   * Global predefined states for advanced state mapping.
   * These are state aliases that can be used in any component.
   * Example: { '@mobile': '@media(w < 920px)', '@dark': '@root(theme=dark)' }
   */
  states?: Record<string, string>;
}

export interface RuleInfo {
  className: string;
  ruleIndex: number;
  sheetIndex: number;
  /** Dev-only: full CSS texts inserted for this class; omitted in production */
  cssText?: string[];
  /** Inclusive end index of the contiguous block of inserted rules for this className */
  endRuleIndex?: number;
  /** NEW: exact indices of all inserted rules for this className */
  indices?: number[];
}

export interface SheetInfo {
  sheet: HTMLStyleElement;
  ruleCount: number;
  holes: number[]; // Available rule indices from deletions
}

export interface CleanupStats {
  timestamp: number;
  classesDeleted: number;
  cssSize: number;
  rulesDeleted: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  bulkCleanups: number; // number of bulk cleanup operations
  totalInsertions: number;
  totalUnused: number; // total styles marked as unused
  stylesCleanedUp: number; // total number of styles cleaned up in bulk operations
  cleanupHistory: CleanupStats[]; // detailed history of each cleanup operation
  startTime: number;

  // Calculated getters
  unusedHits?: number; // calculated as current unused styles count (refCount = 0)
}

export interface RootRegistry {
  sheets: SheetInfo[];
  refCounts: Map<string, number>; // className -> refCount (0 means unused)
  rules: Map<string, RuleInfo>; // className -> rule info (includes both active and unused)
  /** Cache key to className mapping to avoid dual storage of RuleInfo objects */
  cacheKeyToClassName: Map<string, string>; // cacheKey -> className
  /** Deduplication set of fully materialized CSS rules inserted into sheets */
  ruleTextSet: Set<string>;
  /** Scheduled bulk cleanup timeout */
  bulkCleanupTimeout:
    | ReturnType<typeof requestIdleCallback>
    | ReturnType<typeof setTimeout>
    | null;
  /** Scheduled cleanup check timeout */
  cleanupCheckTimeout: ReturnType<typeof setTimeout> | null;
  /** Performance metrics (optional) */
  metrics?: CacheMetrics;
  /** Counter for generating sequential class names like t0, t1, t2... */
  classCounter: number;
  /** Keyframes cache by content hash -> entry */
  keyframesCache: Map<string, KeyframesCacheEntry>;
  /** Keyframes name to content hash mapping for collision detection */
  keyframesNameToContent: Map<string, string>; // providedName -> contentHash
  /** Counter for generating keyframes names like k0, k1, k2... */
  keyframesCounter: number;
  /** Set of injected @property names for tracking */
  injectedProperties: Set<string>;
  /** Global rules tracking for index adjustment */
  globalRules: Map<string, RuleInfo>; // globalKey -> rule info
}

// StyleRule is now just an alias for StyleResult from the pipeline
export type StyleRule = import('../pipeline').StyleResult;

export interface KeyframesInfo {
  name: string;
  sheetIndex: number;
  ruleIndex: number;
  /** Dev-only: full CSS text of the @keyframes rule; omitted in production */
  cssText?: string;
}

export type KeyframeStep = string | Record<string, string | number>;
export type KeyframesSteps = Record<string, KeyframeStep>;

export interface KeyframesResult {
  toString(): string;
  dispose: () => void;
}

export interface KeyframesCacheEntry {
  name: string;
  refCount: number;
  info: KeyframesInfo;
}

export interface RawCSSInfo {
  /** Unique identifier for this raw CSS block */
  id: string;
  /** The raw CSS text */
  css: string;
  /** Start offset in the style element's textContent */
  startOffset: number;
  /** End offset in the style element's textContent */
  endOffset: number;
}

export interface RawCSSResult {
  dispose: () => void;
}
