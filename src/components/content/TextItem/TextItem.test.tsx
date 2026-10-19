import { createRef, StrictMode } from 'react';

import {
  act,
  hoverWithPointer,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { AutoTooltipValue } from '../use-auto-tooltip';

import { TextItem } from './TextItem';

describe('<TextItem /> tooltip contracts', () => {
  let overflow: boolean;

  beforeEach(() => {
    overflow = true;
    vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(() =>
      overflow ? 200 : 20,
    );
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(80);
  });
  afterEach(() => vi.restoreAllMocks());

  it.each<{
    name: string;
    tooltip: AutoTooltipValue;
    title: string | null;
  }>([
    { name: 'automatic', tooltip: true, title: 'Label' },
    { name: 'disabled', tooltip: false, title: null },
    { name: 'fixed string', tooltip: 'Fixed', title: 'Fixed' },
    { name: 'automatic object', tooltip: {}, title: 'Label' },
    { name: 'auto off', tooltip: { auto: false }, title: null },
    { name: 'fixed object', tooltip: { title: 'Fixed' }, title: 'Fixed' },
    {
      name: 'fixed title with auto',
      tooltip: { title: 'Fixed', auto: true },
      title: 'Fixed',
    },
    {
      name: 'disabled object',
      tooltip: { title: 'Fixed', isDisabled: true },
      title: null,
    },
    // A nullish title falls back to the auto title, like `{}`.
    {
      name: 'explicit undefined title',
      tooltip: { title: undefined },
      title: 'Label',
    },
    { name: 'explicit null title', tooltip: { title: null }, title: 'Label' },
    // Empty content opens no bubble at all.
    { name: 'explicit empty title', tooltip: { title: '' }, title: null },
    { name: 'explicit false title', tooltip: { title: false }, title: null },
    { name: 'explicit zero title', tooltip: { title: 0 }, title: '0' },
  ])('preserves $name resolution', async ({ tooltip, title }) => {
    await act(async () => {
      renderWithRoot(
        <TextItem as="button" tooltip={tooltip}>
          Label
        </TextItem>,
      );
    });
    await hoverWithPointer(screen.getByRole('button'));
    // Disabled/absent providers must stay absent past the open delay.
    if (title === null) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).not.toHaveAttribute(
        'aria-describedby',
      );
    } else {
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.textContent).toBe(title);
        expect(screen.getByRole('button')).toHaveAttribute(
          'aria-describedby',
          tooltip.id,
        );
      });
    }
  });

  it('does not activate an auto title while text fits', async () => {
    overflow = false;
    renderWithRoot(
      <TextItem
        tooltip={{ title: 'Fixed', auto: true, isOpen: true }}
        as="button"
      >
        Label
      </TextItem>,
    );
    await hoverWithPointer(screen.getByRole('button'));
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('forwards replacement refs and keeps current text, highlight and options', async () => {
    const before = vi.fn();
    const after = createRef<HTMLElement>();
    const content = (changed: boolean) => (
      <StrictMode>
        <TextItem
          as="button"
          ref={changed ? after : before}
          highlight={changed ? 'New' : 'Old'}
          tooltip={{
            title: changed ? 'New tip' : 'Old tip',
            isOpen: true,
            qa: 'OwnTooltip',
            isLight: changed,
          }}
          preset="t3"
        >
          {changed ? 'New label' : 'Old label'}
        </TextItem>
      </StrictMode>
    );
    const { rerender, unmount } = renderWithRoot(content(false));
    await waitFor(() =>
      expect(screen.getByTestId('OwnTooltip')).toHaveTextContent('Old tip'),
    );
    const button = screen.getByRole('button');
    rerender(content(true));
    expect(before).toHaveBeenLastCalledWith(null);
    expect(after.current).toBe(button);
    expect(button.querySelector('mark')).toHaveTextContent('New');
    await waitFor(() =>
      expect(screen.getByTestId('OwnTooltip')).toHaveTextContent('New tip'),
    );
    await userEvent.keyboard('{Escape}');
    unmount();
    expect(after.current).toBeNull();
  });
});
