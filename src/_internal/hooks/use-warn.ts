import { useRef } from 'react';

import { warn } from '../../utils/warnings';

import { useEvent } from './use-event';

const GLOBAL_WARNED = new Set<string>();

export type WarnKey = string | unknown[];
export type WarnArgs = Parameters<typeof warn>;
export type WarnParameters<T extends WarnKey = WarnKey> = {
  /**
   * If true, the warning will only be shown once per session.
   * If false, the warning will be shown once for a component instance.
   *
   * @default true
   */
  once?: boolean;
  key?: T;
  args: [...WarnArgs];
};

export function useWarn<Condition, Key extends WarnKey>(
  condition: Condition,
  params: WarnParameters<Key>,
) {
  const { once = true, key, args } = params;

  const hasWarnedRef = useRef(false);

  const execute = useEvent((condition: Condition, args: WarnArgs) => {
    if (condition) {
      warn(...args);
      return true;
    }

    return false;
  });

  if (once) {
    const keyString = JSON.stringify(key);

    if (GLOBAL_WARNED.has(keyString)) return;

    if (execute(condition, args)) {
      GLOBAL_WARNED.add(keyString);
      return;
    }
  }

  if (hasWarnedRef.current) return;

  if (execute(condition, args)) {
    hasWarnedRef.current = true;
    return;
  }
}
