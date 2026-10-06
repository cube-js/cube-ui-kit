import { memo, ReactNode, useEffect, useState } from 'react';

import { act, render, screen, userEvent } from '../../test';

import { useFocus } from './interactions';

function Target({ qa }: { qa: string }) {
  const { focusProps, isFocused } = useFocus(true);

  return (
    <button data-qa={qa} data-focused={isFocused || undefined} {...focusProps}>
      {qa}
    </button>
  );
}

type FocusLoss = 'fieldset' | 'tabIndex';

function Probe({ loss, isOff }: { loss: FocusLoss; isOff: boolean }) {
  const { focusProps, isFocused } = useFocus(true);

  const props = {
    'data-qa': 'probe',
    'data-focused': isFocused || undefined,
    ...focusProps,
  };

  return loss === 'fieldset' ? (
    <fieldset disabled={isOff}>
      <button {...props}>probe</button>
    </fieldset>
  ) : (
    <div {...props} tabIndex={isOff ? undefined : 0}>
      probe
    </div>
  );
}

/**
 * A browser moves focus off an element that stops being focusable without a
 * blur React sees. jsdom keeps the focus there, so only a real browser shows
 * whether `useFocus` drops it.
 */
describe.each<FocusLoss>(['fieldset', 'tabIndex'])(
  'useFocus when a %s change takes its focus',
  (loss) => {
    it('drops focus in the same render', async () => {
      const { rerender } = render(<Probe loss={loss} isOff={false} />);

      await userEvent.tab();
      expect(screen.getByTestId('probe')).toHaveAttribute('data-focused');

      rerender(<Probe loss={loss} isOff />);

      expect(screen.getByTestId('probe')).not.toHaveFocus();
      expect(screen.getByTestId('probe')).not.toHaveAttribute('data-focused');
    });
  },
);

// Lets a test flip a component's own state, so the control it holds as
// `children` does not re-render with it.
const toggles: Record<string, (isOn: boolean) => void> = {};

function useToggle(name: string) {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    toggles[name] = setIsOn;
  });

  return isOn;
}

function Section({ children }: { children: ReactNode }) {
  return <fieldset disabled={useToggle('section')}>{children}</fieldset>;
}

// Stands in for a child that restructures itself, as `Item` does when it
// mounts a tooltip for a label that starts to overflow.
function Wrapper({ children }: { children: ReactNode }) {
  return useToggle('wrapper') ? <span>{children}</span> : children;
}

function WrappedTarget() {
  const { focusProps, isFocused } = useFocus(true);

  return (
    <Wrapper>
      <button
        data-qa="wrapped"
        data-focused={isFocused || undefined}
        {...focusProps}
      >
        wrapped
      </button>
    </Wrapper>
  );
}

describe('useFocus when a change that does not re-render it takes its focus', () => {
  it('drops focus a parent fieldset took before the next Tab lands', async () => {
    render(
      <>
        <Section>
          <Target qa="probe" />
        </Section>
        <Target qa="other" />
      </>,
    );

    await userEvent.tab();
    expect(screen.getByTestId('probe')).toHaveAttribute('data-focused');

    act(() => toggles.section(true));
    expect(screen.getByTestId('probe')).not.toHaveFocus();

    await userEvent.tab();

    // One ring, where focus is.
    expect(screen.getByTestId('other')).toHaveFocus();
    expect(screen.getByTestId('other')).toHaveAttribute('data-focused');
    expect(screen.getByTestId('probe')).not.toHaveAttribute('data-focused');
  });

  it('drops focus a replacement by a child took on the next key press', async () => {
    render(<WrappedTarget />);

    await userEvent.tab();
    expect(screen.getByTestId('wrapped')).toHaveAttribute('data-focused');

    act(() => toggles.wrapper(true));
    expect(screen.getByTestId('wrapped')).not.toHaveFocus();

    await userEvent.keyboard('a');

    expect(screen.getByTestId('wrapped')).not.toHaveAttribute('data-focused');
  });

  it('keeps focus on a memoized row that a key press moves', async () => {
    const Row = memo(Target);

    function Rows() {
      const [order, setOrder] = useState(['a', 'b', 'c']);

      return (
        <div
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              setOrder(['b', 'c', 'a']);
            }
          }}
        >
          {order.map((qa) => (
            <Row key={qa} qa={qa} />
          ))}
        </div>
      );
    }

    render(<Rows />);

    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');

    // Moving the node blurs it without an event React sees, and React puts
    // focus back once the commit is done.
    const row = screen.getByTestId('a');

    expect(row.parentElement?.lastElementChild).toBe(row);
    expect(row).toHaveFocus();
    expect(row).toHaveAttribute('data-focused');
  });
});
