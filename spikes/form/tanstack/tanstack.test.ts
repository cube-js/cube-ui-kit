import {
  describeStoreConformance,
  FULL_CAPABILITIES,
} from '../shared/conformance';

import { createTanStackStore } from './adapter';

/**
 * Engine gaps found by the spike. Each `false` turns the matching conformance
 * test into `it.fails`, so a gap that closes shows up as a failing test.
 */
export const TANSTACK_CAPABILITIES = {
  ...FULL_CAPABILITIES,
  // Validators start on a later tick; `validating` is never observable
  // synchronously and `valid`-vs-`unvalidated` is layer bookkeeping.
  triStateStatus: false,
  // Debounce timers live inside FieldApi and cannot be observed or cancelled.
  ownsTimers: false,
  // `validateField()` promises hang when the validator hangs; reset/unmount
  // does not settle them.
  settlesCancelledValidation: false,
  // Abort controllers are per validation cause: a value change aborts a
  // pending `change` run but not a pending `submit`/`blur` run, and a rule
  // change aborts nothing. (A stale value result is still dropped — see the
  // probe in the README — but the validator keeps running to completion.)
  abortsSupersededRuns: false,
  // Starting a revalidation clears the error map synchronously, so the error
  // disappears and reappears while the async validator runs.
  keepsErrorsWhileRevalidating: false,
};

describeStoreConformance(
  'TanStack compatibility layer',
  createTanStackStore,
  TANSTACK_CAPABILITIES,
);
