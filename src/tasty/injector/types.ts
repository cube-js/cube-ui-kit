export interface InjectResult {
  className: string;
  dispose: () => void;
}

export type DisposeFunction = () => void;

export interface StyleInjectorConfig {
  nonce?: string;
  useAdoptedStyleSheets?: boolean;
  maxRulesPerSheet?: number; // default: infinite (no cap)
  // mode?: 'nested' | 'atomic'; // TODO: Implement atomic mode
  gcThreshold?: number; // default: 100
}

export interface RuleInfo {
  className: string;
  ruleIndex: number;
  sheetIndex: number;
  cssText: string;
}

export interface SheetInfo {
  sheet: CSSStyleSheet | HTMLStyleElement;
  ruleCount: number;
  holes: number[]; // Available rule indices from deletions
  isAdopted: boolean;
}

export interface RootRegistry {
  sheets: SheetInfo[];
  cache: Map<string, RuleInfo[]>; // Multiple rules per injection
  refCounts: Map<string, number>;
  globalCache: Map<string, RuleInfo[]>; // Multiple rules per global injection
  globalRefCounts: Map<string, number>;
  deletionQueue: string[];
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

// Atomic mode types (future)
export interface AtomicRule {
  property: string;
  value: string;
  selector?: string;
  mediaQuery?: string;
  origin: 'default' | 'variant' | 'props';
  subElement?: string; // For Title: { color: 'blue' }
  zone?: number; // For responsive breakpoints
}
