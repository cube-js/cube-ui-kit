export interface InjectResult {
  className: string;
  dispose: () => void;
}

export type DisposeFunction = () => void;

export interface StyleInjectorConfig {
  nonce?: string;
  useAdoptedStyleSheets?: boolean; // default: false (use style tags)
  maxRulesPerSheet?: number; // default: infinite (no cap)
  cacheSize?: number; // default: 1000 (LRU cache size)
  gcThreshold?: number; // default: 100
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
  sheet: CSSStyleSheet | HTMLStyleElement;
  ruleCount: number;
  holes: number[]; // Available rule indices from deletions
  isAdopted: boolean;
}

export interface RootRegistry {
  sheets: SheetInfo[];
  cache: import('../parser/lru').Lru<string, string>; // cssText -> className
  refCounts: Map<string, number>; // className -> refCount
  rules: Map<string, RuleInfo>; // className -> rule info
  deletionQueue: string[]; // className queue for cleanup
  /** Deduplication set of fully materialized CSS rules inserted into sheets */
  ruleTextSet: Set<string>;
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
