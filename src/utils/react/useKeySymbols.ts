import { useMemo } from 'react';

import { useIsDarwin } from './useIsDarwin';

/* symbols that are identical on every OS */
const COMMON: Record<string, string> = {
  esc: 'Esc',
  escape: 'Esc',
  enter: '⏎',
  return: '⏎',
  space: '␣',
  backspace: '⌫',
  delete: '⌦',
  up: '↑',
  arrowup: '↑',
  down: '↓',
  arrowdown: '↓',
  left: '←',
  arrowleft: '←',
  right: '→',
  arrowright: '→',
};

/* modifiers for macOS / iOS */
const MAC: Record<string, string> = {
  mod: '⌘',
  meta: '⌘',
  cmd: '⌘',
  command: '⌘',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  option: '⌥',
  shift: '⇧',
};

/* modifiers for Windows / Linux */
const PC: Record<string, string> = {
  mod: 'Ctrl',
  ctrl: 'Ctrl',
  control: 'Ctrl',
  meta: 'Win',
  win: 'Win',
  windows: 'Win',
  cmd: 'Win',
  command: 'Win',
  alt: '⎇',
  option: '⎇',
  shift: '⇧',
};

/**
 * useKeySymbols
 * -------------
 * Turns an author string such as
 *   "mod+k, ctrl+k"
 * into
 *   [["⌘", "K"], ["Ctrl", "K"]]
 */
export function useKeySymbols(combo: string): string[][] {
  const isDarwin = useIsDarwin(); // ⌘ by default during SSR
  const modifiers = isDarwin ? MAC : PC;

  return useMemo(() => {
    /** split on commas, trim each alternative */
    return combo
      .split(',')
      .map((raw) => raw.trim().toLowerCase())
      .filter(Boolean) // drop empty fragments
      .map((alternative) =>
        alternative.split('+').map((part) => {
          const key = part.trim();
          return (
            modifiers[key] ?? // platform-specific modifier
            COMMON[key] ?? // shared glyphs
            part.toUpperCase() // plain key
          );
        }),
      );
  }, [combo, modifiers]);
}
