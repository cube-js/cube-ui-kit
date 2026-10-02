import type { KeyboardEvent } from '@react-types/shared';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { CubeComboBoxProps } from './ComboBox/ComboBox';
import type { CubeNumberInputProps } from './NumberInput/NumberInput';
import type { CubePasswordInputProps } from './PasswordInput/PasswordInput';
import type { CubeSearchComboBoxProps } from './SearchComboBox/SearchComboBox';
import type { CubeTextAreaProps } from './TextArea/TextArea';
import type { CubeTextInputProps } from './TextInput/TextInput';

/**
 * `onKeyDown` / `onKeyUp` on the text fields, and `onKeyDown` on the
 * comboboxes, are a typed contract, with React Aria's signature. Compiled by `pnpm test:types`; nothing here runs. In-repo
 * the Aria prop types resolve to `any` (`preserveSymlinks`), so without the
 * explicit `TextFieldKeyboardProps` every one of these would be `any`.
 *
 * Plain conditional types rather than `expectTypeOf`: under the same setting
 * `expectTypeOf` resolves to `any` here, so it accepts any comparison.
 */
type KeyboardHandler = ((e: KeyboardEvent) => void) | undefined;

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type TextFieldKeyboardChecks = [
  Expect<Equal<CubeTextInputProps['onKeyDown'], KeyboardHandler>>,
  Expect<Equal<CubeTextInputProps['onKeyUp'], KeyboardHandler>>,
  Expect<Equal<CubeTextAreaProps['onKeyDown'], KeyboardHandler>>,
  Expect<Equal<CubeTextAreaProps['onKeyUp'], KeyboardHandler>>,
  Expect<Equal<CubePasswordInputProps['onKeyDown'], KeyboardHandler>>,
  Expect<Equal<CubePasswordInputProps['onKeyUp'], KeyboardHandler>>,
  Expect<Equal<CubeNumberInputProps['onKeyDown'], KeyboardHandler>>,
  Expect<Equal<CubeNumberInputProps['onKeyUp'], KeyboardHandler>>,
  Expect<Equal<CubeComboBoxProps<unknown>['onKeyDown'], KeyboardHandler>>,
  Expect<Equal<CubeSearchComboBoxProps<unknown>['onKeyDown'], KeyboardHandler>>,
];

/**
 * The combobox docs tell handlers to call `e.continuePropagation()`; with a
 * plain React keyboard event this is TS2339.
 */
export const comboBoxContinuesPropagation: CubeComboBoxProps<unknown>['onKeyDown'] =
  (e) => {
    if (e.key === 'Enter') e.continuePropagation();
  };

export const searchComboBoxContinuesPropagation: CubeSearchComboBoxProps<unknown>['onKeyDown'] =
  (e) => {
    if (e.key === 'Enter') e.continuePropagation();
  };

/** A handler written against the old React event type still type-checks. */
export const comboBoxReactTypedHandler: CubeComboBoxProps<unknown>['onKeyDown'] =
  (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.preventDefault();
  };
