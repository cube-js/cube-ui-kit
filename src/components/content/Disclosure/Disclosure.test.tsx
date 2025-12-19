import { act, renderWithRoot, userEvent, waitFor } from '../../../test';

import { Disclosure } from './Disclosure';

jest.mock('../../../_internal/hooks/use-warn');

describe('<Disclosure />', () => {
  describe('Basic Rendering', () => {
    it('should render trigger and content', () => {
      const { getByRole, getByText } = renderWithRoot(
        <Disclosure defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(getByRole('button', { name: 'Toggle' })).toBeInTheDocument();
      expect(getByText('Content')).toBeInTheDocument();
    });

    it('should add data-qa attribute', () => {
      const { getByTestId } = renderWithRoot(
        <Disclosure qa="test-disclosure">
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(getByTestId('test-disclosure')).toBeInTheDocument();
    });

    it('should add data-qa to content', () => {
      const { container } = renderWithRoot(
        <Disclosure defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content qa="disclosure-content">
            Content
          </Disclosure.Content>
        </Disclosure>,
      );

      expect(
        container.querySelector('[data-qa="disclosure-content"]'),
      ).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('should start collapsed by default', () => {
      const { getByRole } = renderWithRoot(
        <Disclosure>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should expand on click', async () => {
      const { getByRole } = renderWithRoot(
        <Disclosure>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      const trigger = getByRole('button');

      await userEvent.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should collapse on second click', async () => {
      const { getByRole } = renderWithRoot(
        <Disclosure defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      const trigger = getByRole('button');

      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should call onExpandedChange when expanded', async () => {
      const onExpandedChange = jest.fn();

      const { getByRole } = renderWithRoot(
        <Disclosure onExpandedChange={onExpandedChange}>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      await userEvent.click(getByRole('button'));

      await waitFor(() => {
        expect(onExpandedChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Keyboard Interactions', () => {
    it('should expand on Enter key', async () => {
      const { getByRole } = renderWithRoot(
        <Disclosure>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      const trigger = getByRole('button');

      await act(async () => {
        trigger.focus();
      });

      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should expand on Space key', async () => {
      const { getByRole } = renderWithRoot(
        <Disclosure>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      const trigger = getByRole('button');

      await act(async () => {
        trigger.focus();
      });

      await userEvent.keyboard(' ');

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Controlled State', () => {
    it('should respect controlled isExpanded prop', () => {
      const { getByRole, rerender } = renderWithRoot(
        <Disclosure isExpanded={false}>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(getByRole('button')).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <Disclosure isExpanded={true}>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('should respect defaultExpanded prop', () => {
      const { getByRole } = renderWithRoot(
        <Disclosure defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should disable trigger when isDisabled is true', () => {
      const { getByRole } = renderWithRoot(
        <Disclosure isDisabled>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not expand when disabled', async () => {
      const onExpandedChange = jest.fn();

      const { getByRole } = renderWithRoot(
        <Disclosure isDisabled onExpandedChange={onExpandedChange}>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      await userEvent.click(getByRole('button'));

      expect(onExpandedChange).not.toHaveBeenCalled();
      expect(getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should force close when disabled even if defaultExpanded', () => {
      const { getByRole } = renderWithRoot(
        <Disclosure isDisabled defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('ARIA Attributes', () => {
    it('should have correct aria-controls linking', () => {
      const { getByRole, container } = renderWithRoot(
        <Disclosure defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      const trigger = getByRole('button');
      const ariaControls = trigger.getAttribute('aria-controls');

      expect(ariaControls).toBeTruthy();
      expect(container.querySelector(`#${ariaControls}`)).toBeInTheDocument();
    });
  });

  describe('Render Prop', () => {
    it('should provide state context via render prop', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <Disclosure>
          {({ isExpanded, toggle }) => (
            <>
              <button onClick={toggle}>Custom Toggle</button>
              <span>{isExpanded ? 'Open' : 'Closed'}</span>
            </>
          )}
        </Disclosure>,
      );

      expect(getByText('Closed')).toBeInTheDocument();

      await userEvent.click(getByRole('button'));

      await waitFor(() => {
        expect(getByText('Open')).toBeInTheDocument();
      });
    });
  });

  describe('Shape Variants', () => {
    it('should render with card shape', () => {
      const { container } = renderWithRoot(
        <Disclosure shape="card">
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(
        container.querySelector('[data-shape="card"]'),
      ).toBeInTheDocument();
    });

    it('should render with sharp shape', () => {
      const { container } = renderWithRoot(
        <Disclosure shape="sharp">
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>Content</Disclosure.Content>
        </Disclosure>,
      );

      expect(
        container.querySelector('[data-shape="sharp"]'),
      ).toBeInTheDocument();
    });
  });
});

describe('<Disclosure.Group />', () => {
  it('should render multiple disclosure items', () => {
    const { getAllByRole } = renderWithRoot(
      <Disclosure.Group>
        <Disclosure.Item id="1">
          <Disclosure.Trigger>Item 1</Disclosure.Trigger>
          <Disclosure.Content>Content 1</Disclosure.Content>
        </Disclosure.Item>
        <Disclosure.Item id="2">
          <Disclosure.Trigger>Item 2</Disclosure.Trigger>
          <Disclosure.Content>Content 2</Disclosure.Content>
        </Disclosure.Item>
      </Disclosure.Group>,
    );

    expect(getAllByRole('button')).toHaveLength(2);
  });

  it('should only allow single expanded by default (accordion)', async () => {
    const { getAllByRole } = renderWithRoot(
      <Disclosure.Group>
        <Disclosure.Item id="1">
          <Disclosure.Trigger>Item 1</Disclosure.Trigger>
          <Disclosure.Content>Content 1</Disclosure.Content>
        </Disclosure.Item>
        <Disclosure.Item id="2">
          <Disclosure.Trigger>Item 2</Disclosure.Trigger>
          <Disclosure.Content>Content 2</Disclosure.Content>
        </Disclosure.Item>
      </Disclosure.Group>,
    );

    const [trigger1, trigger2] = getAllByRole('button');

    // Expand first item
    await userEvent.click(trigger1);

    await waitFor(() => {
      expect(trigger1).toHaveAttribute('aria-expanded', 'true');
    });
    expect(trigger2).toHaveAttribute('aria-expanded', 'false');

    // Expand second item - should collapse first
    await userEvent.click(trigger2);

    await waitFor(() => {
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
    });
    expect(trigger1).toHaveAttribute('aria-expanded', 'false');
  });

  it('should allow multiple expanded when allowsMultipleExpanded is true', async () => {
    const { getAllByRole } = renderWithRoot(
      <Disclosure.Group allowsMultipleExpanded>
        <Disclosure.Item id="1">
          <Disclosure.Trigger>Item 1</Disclosure.Trigger>
          <Disclosure.Content>Content 1</Disclosure.Content>
        </Disclosure.Item>
        <Disclosure.Item id="2">
          <Disclosure.Trigger>Item 2</Disclosure.Trigger>
          <Disclosure.Content>Content 2</Disclosure.Content>
        </Disclosure.Item>
      </Disclosure.Group>,
    );

    const [trigger1, trigger2] = getAllByRole('button');

    // Expand first item
    await userEvent.click(trigger1);

    await waitFor(() => {
      expect(trigger1).toHaveAttribute('aria-expanded', 'true');
    });

    // Expand second item
    await userEvent.click(trigger2);

    await waitFor(() => {
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
    });

    // Both should be expanded
    expect(trigger1).toHaveAttribute('aria-expanded', 'true');
    expect(trigger2).toHaveAttribute('aria-expanded', 'true');
  });

  it('should respect defaultExpandedKeys', () => {
    const { getAllByRole } = renderWithRoot(
      <Disclosure.Group defaultExpandedKeys={['2']}>
        <Disclosure.Item id="1">
          <Disclosure.Trigger>Item 1</Disclosure.Trigger>
          <Disclosure.Content>Content 1</Disclosure.Content>
        </Disclosure.Item>
        <Disclosure.Item id="2">
          <Disclosure.Trigger>Item 2</Disclosure.Trigger>
          <Disclosure.Content>Content 2</Disclosure.Content>
        </Disclosure.Item>
      </Disclosure.Group>,
    );

    const [trigger1, trigger2] = getAllByRole('button');

    expect(trigger1).toHaveAttribute('aria-expanded', 'false');
    expect(trigger2).toHaveAttribute('aria-expanded', 'true');
  });

  it('should call onExpandedChange with updated keys', async () => {
    const onExpandedChange = jest.fn();

    const { getAllByRole } = renderWithRoot(
      <Disclosure.Group onExpandedChange={onExpandedChange}>
        <Disclosure.Item id="1">
          <Disclosure.Trigger>Item 1</Disclosure.Trigger>
          <Disclosure.Content>Content 1</Disclosure.Content>
        </Disclosure.Item>
        <Disclosure.Item id="2">
          <Disclosure.Trigger>Item 2</Disclosure.Trigger>
          <Disclosure.Content>Content 2</Disclosure.Content>
        </Disclosure.Item>
      </Disclosure.Group>,
    );

    const [trigger1] = getAllByRole('button');

    await userEvent.click(trigger1);

    await waitFor(() => {
      expect(onExpandedChange).toHaveBeenCalledWith(new Set(['1']));
    });
  });

  it('should disable all items when group isDisabled', () => {
    const { getAllByRole } = renderWithRoot(
      <Disclosure.Group isDisabled>
        <Disclosure.Item id="1">
          <Disclosure.Trigger>Item 1</Disclosure.Trigger>
          <Disclosure.Content>Content 1</Disclosure.Content>
        </Disclosure.Item>
        <Disclosure.Item id="2">
          <Disclosure.Trigger>Item 2</Disclosure.Trigger>
          <Disclosure.Content>Content 2</Disclosure.Content>
        </Disclosure.Item>
      </Disclosure.Group>,
    );

    const triggers = getAllByRole('button');

    triggers.forEach((trigger) => {
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
    });
  });
});

describe('Nested Disclosures', () => {
  it('should maintain independent state for nested disclosures', async () => {
    const { getAllByRole } = renderWithRoot(
      <Disclosure defaultExpanded qa="outer">
        <Disclosure.Trigger>Outer</Disclosure.Trigger>
        <Disclosure.Content>
          <Disclosure qa="inner">
            <Disclosure.Trigger>Inner</Disclosure.Trigger>
            <Disclosure.Content>Inner Content</Disclosure.Content>
          </Disclosure>
        </Disclosure.Content>
      </Disclosure>,
    );

    const [outerTrigger, innerTrigger] = getAllByRole('button');

    expect(outerTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(innerTrigger).toHaveAttribute('aria-expanded', 'false');

    // Expand inner
    await userEvent.click(innerTrigger);

    await waitFor(() => {
      expect(innerTrigger).toHaveAttribute('aria-expanded', 'true');
    });
    expect(outerTrigger).toHaveAttribute('aria-expanded', 'true');

    // Collapse outer - inner state should be independent
    await userEvent.click(outerTrigger);

    await waitFor(() => {
      expect(outerTrigger).toHaveAttribute('aria-expanded', 'false');
    });
    // Inner keeps its state even though outer is collapsed
    expect(innerTrigger).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Content Preservation', () => {
  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should preserve content during exit phase', () => {
    // This test verifies that content is stored during the exiting phase
    // Similar to DisplayTransition's preserveContent behavior

    interface TestWrapperProps {
      isExpanded: boolean;
      content: string;
    }

    function TestWrapper({ isExpanded, content }: TestWrapperProps) {
      return (
        <Disclosure isExpanded={isExpanded} transitionDuration={150}>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>
            {/* Simulate parent conditionally rendering content based on its own state */}
            {isExpanded ? content : null}
          </Disclosure.Content>
        </Disclosure>
      );
    }

    const { container, rerender } = renderWithRoot(
      <TestWrapper isExpanded={true} content="original content" />,
    );

    // Initial: expanded with content
    expect(container.textContent).toContain('original content');

    // Trigger collapse - parent passes isExpanded=false and content becomes null
    rerender(<TestWrapper isExpanded={false} content="original content" />);

    // Immediately after rerender, content should still be preserved
    // (stored children from when isExpanded was true)
    expect(container.textContent).toContain('original content');

    // Advance timers to move into exit phase
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // During exit phase, content should still be preserved
    expect(container.textContent).toContain('original content');

    // Advance through the rest of the exit flow
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // After completing the exit transition, content should have been preserved
    // throughout the exit animation
    // The content may no longer be visible after transition completes, but it
    // should have been preserved during the exit phase
  });
});
