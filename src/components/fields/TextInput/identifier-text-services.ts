import type { AriaTextFieldOptions } from 'react-aria';

interface TextServicesProps {
  autoCapitalize?: AriaTextFieldOptions<'input'>['autoCapitalize'];
  autoCorrect?: string;
  spellCheck?: string;
  autoComplete?: string;
}

/**
 * The text-service attributes `isIdentifier` turns off, for the props a field hands to
 * `useTextField`. A value the caller set wins; `inputProps` is merged over the hook's result
 * later, so it wins too.
 */
export function getIdentifierTextServices(
  isIdentifier: boolean | undefined,
  props: TextServicesProps,
): TextServicesProps | undefined {
  if (!isIdentifier) return undefined;

  return {
    autoCapitalize: props.autoCapitalize ?? 'none',
    autoCorrect: props.autoCorrect ?? 'off',
    spellCheck: props.spellCheck ?? 'false',
    autoComplete: props.autoComplete ?? 'off',
  };
}
