// Ensure React 18/19 act() environment is enabled before any React code loads
// This must run in Jest "setupFiles" (before env) to avoid early imports
 
// @ts-expect-error globalThis typing for test env
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
