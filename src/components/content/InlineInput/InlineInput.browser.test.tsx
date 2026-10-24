import { createRef } from 'react';

import { act, renderWithRoot } from '../../../test';

import { CubeInlineInputRef, InlineInput } from './InlineInput';

/**
 * `inputStyles` is merged into `styles.Input` and passed on, so tasty merges
 * it over the element's own `Input` styles once more. A `null` in it has to
 * survive the first merge to remove the default it was meant to remove.
 */
describe('InlineInput inputStyles', () => {
  it('passes a null reset on to the Input', async () => {
    const ref = createRef<CubeInlineInputRef>();

    const { container } = renderWithRoot(
      <InlineInput
        ref={ref}
        defaultValue="hello"
        aria-label="Name"
        inputStyles={{ textAlign: null }}
      />,
    );

    await act(async () => {
      ref.current?.startEditing();
    });

    const input = container.querySelector('input')!;

    expect(getComputedStyle(input).textAlign).not.toBe('left');
  });
});
