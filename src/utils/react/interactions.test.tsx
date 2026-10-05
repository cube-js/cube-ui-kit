import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useFocus } from './interactions';

let unfocusedRenders = 0;

function Probe({
  qa,
  countRenders,
  isDisabled,
}: {
  qa: string;
  countRenders?: boolean;
  isDisabled?: boolean;
}) {
  const { focusProps, isFocused } = useFocus({ isDisabled }, true);

  if (countRenders) {
    unfocusedRenders++;
  }

  return (
    <button data-qa={qa} data-focused={isFocused || undefined} {...focusProps}>
      {qa}
    </button>
  );
}

describe('useFocus with onlyVisible', () => {
  beforeEach(() => {
    unfocusedRenders = 0;
  });

  it('reports keyboard focus and not pointer focus', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Probe qa="first" />
        <Probe qa="second" />
      </>,
    );

    await user.tab();
    expect(screen.getByTestId('first')).toHaveAttribute('data-focused');

    await user.click(screen.getByTestId('second'));
    expect(screen.getByTestId('second')).not.toHaveAttribute('data-focused');
    expect(screen.getByTestId('first')).not.toHaveAttribute('data-focused');
  });

  it('follows a modality switch while the element stays focused', async () => {
    const user = userEvent.setup();
    render(<Probe qa="only" />);

    await user.tab();
    expect(screen.getByTestId('only')).toHaveAttribute('data-focused');

    fireEvent.pointerDown(screen.getByTestId('only'));
    expect(screen.getByTestId('only')).not.toHaveAttribute('data-focused');

    await user.keyboard('a');
    expect(screen.getByTestId('only')).toHaveAttribute('data-focused');
  });

  it('keeps focus hidden when focus moves after typing in a text input', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input data-qa="field" />
        <Probe qa="target" />
      </>,
    );

    await user.click(screen.getByTestId('field'));
    await user.keyboard('a');
    act(() => screen.getByTestId('target').focus());

    expect(screen.getByTestId('target')).not.toHaveAttribute('data-focused');
  });

  it('does not re-render unfocused elements when the input modality switches', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Probe qa="focused" />
        {Array.from({ length: 20 }, (_, i) => (
          <Probe key={i} qa={`idle-${i}`} countRenders />
        ))}
      </>,
    );

    await user.click(screen.getByTestId('focused'));
    unfocusedRenders = 0;

    await user.keyboard('a');
    fireEvent.pointerDown(document.body);
    await user.keyboard('a');

    expect(unfocusedRenders).toBe(0);
  });

  it('reports focus again when re-enabled while still focused', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Probe qa="only" />);

    await user.tab();
    expect(screen.getByTestId('only')).toHaveAttribute('data-focused');

    // An `aria-disabled` control keeps DOM focus while disabled, and no focus
    // event fires when it is enabled again.
    rerender(<Probe qa="only" isDisabled />);
    expect(screen.getByTestId('only')).not.toHaveAttribute('data-focused');

    rerender(<Probe qa="only" />);
    expect(screen.getByTestId('only')).toHaveFocus();
    expect(screen.getByTestId('only')).toHaveAttribute('data-focused');
  });

  it('does not report focus when re-enabled after focus moved away', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <Probe qa="only" />
        <button data-qa="other">other</button>
      </>,
    );

    await user.tab();
    rerender(
      <>
        <Probe qa="only" isDisabled />
        <button data-qa="other">other</button>
      </>,
    );
    act(() => screen.getByTestId('other').focus());
    rerender(
      <>
        <Probe qa="only" />
        <button data-qa="other">other</button>
      </>,
    );

    expect(screen.getByTestId('only')).not.toHaveAttribute('data-focused');
  });
});
