import { useState } from 'react';

import { act, renderWithRoot, userEvent, waitFor } from '../../test/index';

import { ItemAction } from './ItemAction/ItemAction';
import { ItemButton } from './ItemButton/ItemButton';

/**
 * The wrapper `ItemButton` puts around a row that has actions — the layer that
 * keeps them out of the `<button>` — and the two things about it that are not
 * visible from the outside: it does not come and go with the actions, and an
 * empty run reserves nothing.
 */
describe('<ItemActionsWrapper />', () => {
  function Toggler({ initial = true }: { initial?: boolean }) {
    const [hasActions, setHasActions] = useState(initial);

    return (
      <>
        <button
          type="button"
          data-qa="Toggle"
          onClick={() => setHasActions((v) => !v)}
        >
          toggle
        </button>
        <ItemButton
          qa="Row"
          actions={hasActions ? <ItemButton.Action qa="Act" /> : undefined}
        >
          Row
        </ItemButton>
      </>
    );
  }

  it('keeps the same button element when the actions go away', async () => {
    const { getByTestId, queryByTestId } = renderWithRoot(<Toggler />);

    const before = getByTestId('Row');

    expect(queryByTestId('Act')).toBeInTheDocument();

    await act(async () => await userEvent.click(getByTestId('Toggle')));

    expect(queryByTestId('Act')).not.toBeInTheDocument();
    // Dropping the wrapper would remount the button — losing focus, any running
    // transition, and every ref pointing at it.
    expect(getByTestId('Row')).toBe(before);
    expect(
      document.querySelector('[data-element="Actions"]'),
    ).toBeInTheDocument();
  });

  it('reserves nothing for an empty run', async () => {
    const { getByTestId } = renderWithRoot(<Toggler />);

    await act(async () => await userEvent.click(getByTestId('Toggle')));

    const wrapper = getByTestId('Row').parentElement!;

    // jsdom reports every `offsetWidth` as 0, so the run's own measurement is
    // not what this asserts — it asserts that an empty run is not measured at
    // all, which is what keeps the row's placeholder column at zero.
    expect(wrapper.style.getPropertyValue('--actions-width')).toBe('0px');
  });

  it('reserves no end content once the run has emptied', async () => {
    const { getByTestId } = renderWithRoot(<Toggler />);

    const row = getByTestId('Row');

    expect(row).toHaveAttribute('data-has-actions');

    await act(async () => await userEvent.click(getByTestId('Toggle')));

    // The row still LAYS OUT for a sibling run — that is what keeps the DOM
    // from restructuring — but it no longer counts one as end content, which is
    // what drives the two-square minimum width and the suffix's padding. A
    // trigger whose run is empty has to stay the shape it was.
    expect(row).toHaveAttribute('data-inside-wrapper');
    expect(row).not.toHaveAttribute('data-has-actions');
    expect(row).not.toHaveAttribute('data-has-end-content');
  });

  it('keeps the run for `actions={null}`, without reserving for it', () => {
    const { getByTestId } = renderWithRoot(
      <ItemButton qa="Row" actions={null}>
        Row
      </ItemButton>,
    );

    const row = getByTestId('Row');

    // How the field triggers ask for a run up front: the wrapper and the run
    // are there from the first render, so actions arriving later never remount
    // the button, but an empty run is not end content.
    expect(
      row.parentElement?.querySelector('[data-element="Actions"]'),
    ).toBeInTheDocument();
    expect(row).not.toHaveAttribute('data-has-actions');
  });

  it('keeps actions added while hidden reachable by keyboard', async () => {
    const { getByRole, rerender } = renderWithRoot(
      <ItemButton autoHideActions actions={null}>
        Row
      </ItemButton>,
    );

    rerender(
      <ItemButton autoHideActions actions={<ItemAction>Pin</ItemAction>}>
        Row
      </ItemButton>,
    );

    const row = getByRole('button', { name: 'Row' });
    const wrapper = row.parentElement!;

    expect(wrapper).not.toHaveAttribute('data-actions-shown');

    await userEvent.tab();
    expect(row).toHaveFocus();
    expect(wrapper).not.toHaveAttribute('data-actions-shown');

    await userEvent.tab();
    expect(getByRole('button', { name: 'Pin' })).toHaveFocus();

    await waitFor(() => {
      expect(wrapper).toHaveAttribute('data-actions-shown');
    });
  });

  it('does not wrap a row that never had actions', () => {
    const { getByTestId } = renderWithRoot(
      <ItemButton qa="Row">Row</ItemButton>,
    );

    expect(
      getByTestId('Row').parentElement?.querySelector(
        '[data-element="Actions"]',
      ),
    ).toBeNull();
  });

  describe('size observer', () => {
    /** Records which elements each observer watches and whether it let go. */
    class RecordingObserver {
      static all: RecordingObserver[] = [];
      targets: Element[] = [];
      isDisconnected = false;

      constructor() {
        RecordingObserver.all.push(this);
      }

      observe(el: Element) {
        this.targets.push(el);
      }

      unobserve() {}

      disconnect() {
        this.isDisconnected = true;
      }
    }

    function getRun(row: HTMLElement) {
      return row.parentElement!.querySelector(
        ':scope > [data-element="Actions"]',
      )!;
    }

    function watching(el: Element) {
      return RecordingObserver.all.filter((o) => o.targets.includes(el));
    }

    afterEach(() => {
      RecordingObserver.all = [];
      vi.unstubAllGlobals();
    });

    function renderRow(autoHideActions: boolean) {
      return (
        <ItemButton
          qa="Row"
          autoHideActions={autoHideActions}
          actions={<ItemButton.Action qa="Act" />}
        >
          Row
        </ItemButton>
      );
    }

    it('moves to the new run when a prop swaps it, and lets go on unmount', () => {
      vi.stubGlobal('ResizeObserver', RecordingObserver);

      const { getByTestId, rerender, unmount } = renderWithRoot(
        renderRow(true),
      );
      const first = getRun(getByTestId('Row'));

      expect(watching(first)).toHaveLength(1);

      // Dropping `autoHideActions` renders the run as a different element.
      rerender(renderRow(false));

      const second = getRun(getByTestId('Row'));

      expect(second).not.toBe(first);
      expect(watching(first).every((o) => o.isDisconnected)).toBe(true);
      expect(watching(second)).toHaveLength(1);
      expect(watching(second)[0].isDisconnected).toBe(false);

      unmount();

      expect(watching(second)[0].isDisconnected).toBe(true);
    });
  });

  it('renders the actions outside the button', () => {
    const { getByTestId } = renderWithRoot(
      <ItemButton qa="Row" actions={<ItemButton.Action qa="Act" />}>
        Row
      </ItemButton>,
    );

    const row = getByTestId('Row');
    const action = getByTestId('Act');

    expect(row.tagName).toBe('BUTTON');
    expect(action.tagName).toBe('BUTTON');
    expect(row.contains(action)).toBe(false);
  });
});
