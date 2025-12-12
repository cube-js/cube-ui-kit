import { ReactNode } from 'react';

import { Mods } from '../../tasty';

/**
 * Function that receives mods (can be destructured) and returns an icon or true for empty slot.
 * @example
 * icon={({ loading, selected }) => loading ? <SpinnerIcon /> : <Icon />}
 */
export type IconRenderFn<T extends Mods = Mods> = (mods: T) => ReactNode | true;

/** Dynamic icon prop: ReactNode, true for empty slot, or render function */
export type DynamicIcon<T extends Mods = Mods> =
  | ReactNode
  | true
  | IconRenderFn<T>;

export interface ResolvedIcon {
  /** The icon content to render (null for empty slot) */
  content: ReactNode | null;
  /** Whether the slot should be rendered (true even for empty slots) */
  hasSlot: boolean;
}

/**
 * Resolves a dynamic icon prop to its content and slot state.
 * - If `true`: empty slot (hasSlot=true, content=null)
 * - If function: call with mods, then process result
 * - Otherwise: use as-is
 */
export function resolveIcon<T extends Mods>(
  icon: DynamicIcon<T> | undefined,
  mods: T,
): ResolvedIcon {
  if (icon === undefined || icon === null || icon === false) {
    return { content: null, hasSlot: false };
  }

  if (icon === true) {
    return { content: null, hasSlot: true };
  }

  if (typeof icon === 'function') {
    const result = (icon as IconRenderFn<T>)(mods);
    if (result === true) {
      return { content: null, hasSlot: true };
    }
    if (result === undefined || result === null || result === false) {
      return { content: null, hasSlot: false };
    }
    return { content: result, hasSlot: true };
  }

  return { content: icon, hasSlot: true };
}
