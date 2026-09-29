import { useState } from 'react';

import {
  render,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Content } from '../../content/Content';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

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

  // The list used to take an outside press for itself: a native button got no
  // pointerdown, mousedown or click, so the first Save only closed the list.
  it('saves on the first click while the list shows, with the typed text committed', async () => {
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
          <TagInput
            allowsCustomValue
            label="Cities"
            value={values}
            onChange={setValues}
          >
            <TagInput.Item key="Paris">Paris</TagInput.Item>
            <TagInput.Item key="Porto">Porto</TagInput.Item>
          </TagInput>
          <button type="submit">Save</button>
        </form>
      );
    }

    renderWithRoot(<Harness />);

    await userEvent.type(screen.getByRole('combobox'), 'par');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(['par']);
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
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

  /**
   * The list lets an outside press on a control reach it, so the case to
   * guard is a dismissable dialog around the field. React Aria closes an
   * overlay on an outside click only when it is the topmost one in its stack.
   * A list that let the backdrop press through would close itself a task
   * after the pointerdown, leave the stack, and the click would then close
   * the dialog too. The backdrop is not a control, so the list takes that
   * press as before and stays on top until the click.
   */
  describe('in a dismissable dialog', () => {
    function PolicyDialog({ onSubmit }: { onSubmit: (v: string[]) => void }) {
      const [values, setValues] = useState<string[]>([]);

      return (
        <DialogTrigger isDismissable type="modal">
          <Button>Edit policy</Button>
          <Dialog>
            <Content>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmit(values);
                }}
              >
                <TagInput
                  allowsCustomValue
                  label="Principals"
                  value={values}
                  onChange={setValues}
                >
                  <TagInput.Item key="admin">admin</TagInput.Item>
                  <TagInput.Item key="analyst">analyst</TagInput.Item>
                </TagInput>
                <button type="submit">Save</button>
              </form>
            </Content>
          </Dialog>
        </DialogTrigger>
      );
    }

    async function openWithList(text: string) {
      await userEvent.click(
        screen.getByRole('button', { name: 'Edit policy' }),
      );
      await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
      await userEvent.type(screen.getByRole('combobox'), text);
      await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());
    }

    const backdrop = () => screen.getByTestId('Underlay');

    it('closes only the list on a backdrop press', async () => {
      renderWithRoot(<PolicyDialog onSubmit={vi.fn()} />);

      await openWithList('ad');
      // A corner of the backdrop, well clear of the dialog.
      await userEvent.click(backdrop(), { position: { x: 4, y: 4 } });

      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(screen.getByRole('dialog')).toBeVisible();
      expect(screen.getByRole('combobox')).toHaveFocus();
      expect(screen.getByRole('combobox')).toHaveValue('ad');

      // With the list gone, the same press is the dialog's again.
      await userEvent.click(backdrop(), { position: { x: 4, y: 4 } });
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    // A person holds the button down for a while, and the list must still be
    // on top when the click lands. Vitest's `click()` has no press duration,
    // so the press is dispatched by hand; the backdrop takes no focus, so a
    // trusted event would do nothing more here.
    it('closes only the list on a backdrop press held down like a person does', async () => {
      renderWithRoot(<PolicyDialog onSubmit={vi.fn()} />);

      await openWithList('ad');

      const init = {
        bubbles: true,
        cancelable: true,
        composed: true,
        button: 0,
        buttons: 1,
        clientX: 4,
        clientY: 4,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      };

      backdrop().dispatchEvent(new PointerEvent('pointerdown', init));
      await new Promise((resolve) => setTimeout(resolve, 150));
      backdrop().dispatchEvent(
        new PointerEvent('pointerup', { ...init, buttons: 0 }),
      );
      backdrop().dispatchEvent(
        new MouseEvent('click', { ...init, buttons: 0 }),
      );

      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(screen.getByRole('dialog')).toBeVisible();
      expect(screen.getByRole('combobox')).toHaveValue('ad');
    });

    it('submits with the typed text committed from a native Save in the dialog', async () => {
      const onSubmit = vi.fn();

      renderWithRoot(<PolicyDialog onSubmit={onSubmit} />);

      await openWithList('ad');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit).toHaveBeenCalledWith(['ad']);
      expect(screen.getByRole('dialog')).toBeVisible();
    });
  });
});
