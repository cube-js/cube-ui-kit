import { useState } from 'react';

import { render, screen, userEvent, waitFor } from '../../../test';

import { TagInput } from './TagInput';

/**
 * Focus reaches the field in the same frame as the press that moves it. A
 * Playwright `click()` (like a fast tap) sends mousedown, mouseup and click
 * with no animation frame between them, so anything the field does on blur or
 * focus has to happen during the focus event itself to be seen by the click.
 * jsdom has no frames, only a 16 ms timer standing in for them, so these cases
 * run in a real browser.
 */
describe('<TagInput /> focus timing', () => {
  it('commits the typed text before a Save click submits the form', async () => {
    const onSubmit = vi.fn();

    function Harness() {
      const [values, setValues] = useState<string[]>([]);

      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          <TagInput label="Tags" value={values} onChange={setValues} />
          <button type="submit">Save</button>
        </form>
      );
    }

    render(<Harness />);

    await userEvent.type(screen.getByRole('textbox'), 'one');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(['one']);
  });

  it('reports focus before the change the same click makes', async () => {
    function Harness() {
      const [isEmpty, setIsEmpty] = useState(false);

      return (
        <>
          <button>Before</button>
          <TagInput
            label="Tags"
            defaultValue={['one']}
            onFocus={() => setIsEmpty(false)}
            onChange={(next) => setIsEmpty(next.length === 0)}
          />
          <span data-qa="Empty">{isEmpty ? 'Add a tag' : ''}</span>
        </>
      );
    }

    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove one' }));

    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    // A frame for a late focus report to land, had there been one.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(screen.getByTestId('Empty')).toHaveTextContent('Add a tag');
  });
});
