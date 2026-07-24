import { renderWithRoot } from '../../../test';
import { Menu } from '../../actions/Menu';

import { Tab, Tabs } from './Tabs';

vi.mock('../../../_internal/hooks/use-warn');

describe('<Tabs /> context menu modes', () => {
  /** Tab row renders actions outside Item; Item also has an empty Actions slot. */
  function actionsContainerWithButtons(tab: HTMLElement) {
    let node: HTMLElement | null = tab.parentElement;
    let depth = 0;
    while (node && depth < 40) {
      depth += 1;
      for (const child of Array.from(node.children)) {
        if (
          child.getAttribute('data-element') === 'Actions' &&
          child.querySelector('button')
        ) {
          return child as HTMLElement;
        }
      }
      node = node.parentElement;
    }
    return null;
  }

  it('contextMenu true keeps overflow trigger and hides inline close when menu is non-empty', () => {
    const onDelete = vi.fn();
    const { getByRole } = renderWithRoot(
      <Tabs
        contextMenu
        defaultActiveKey="tab1"
        menu={<Menu.Item key="rename">Rename</Menu.Item>}
        onDelete={onDelete}
      >
        <Tab key="tab1" title="Tab 1">
          Content
        </Tab>
      </Tabs>,
    );

    const actionsEl = actionsContainerWithButtons(
      getByRole('tab', { name: 'Tab 1' }),
    );
    expect(actionsEl).toBeTruthy();
    // Prefer DOM queries over within().queryByRole — under happy-dom, role
    // queries inside the Actions slot can stall when a Menu is wired up.
    expect(
      actionsEl!.querySelector('[aria-label="Close"]'),
    ).not.toBeInTheDocument();
    expect(actionsEl!.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('contextMenu context-only shows inline close and no overflow trigger', () => {
    const onDelete = vi.fn();
    const { getByRole } = renderWithRoot(
      <Tabs
        defaultActiveKey="tab1"
        contextMenu="context-only"
        menu={<Menu.Item key="rename">Rename</Menu.Item>}
        onDelete={onDelete}
      >
        <Tab key="tab1" title="Tab 1">
          Content
        </Tab>
      </Tabs>,
    );

    const actionsEl = actionsContainerWithButtons(
      getByRole('tab', { name: 'Tab 1' }),
    );
    expect(actionsEl).toBeTruthy();
    expect(
      actionsEl!.querySelector('[aria-label="Close"]'),
    ).toBeInTheDocument();
    expect(actionsEl!.querySelectorAll('button')).toHaveLength(1);
  });

  it('contextMenu context-only with no menu behaves like false (inline close, no context menu)', () => {
    const onDelete = vi.fn();
    const { getByRole, container } = renderWithRoot(
      <Tabs
        defaultActiveKey="tab1"
        contextMenu="context-only"
        onDelete={onDelete}
      >
        <Tab key="tab1" title="Tab 1">
          Content
        </Tab>
      </Tabs>,
    );

    const actionsEl = actionsContainerWithButtons(
      getByRole('tab', { name: 'Tab 1' }),
    );
    expect(actionsEl).toBeTruthy();
    expect(
      actionsEl!.querySelector('[aria-label="Close"]'),
    ).toBeInTheDocument();
    expect(actionsEl!.querySelectorAll('button')).toHaveLength(1);
    expect(
      container.querySelector('[aria-label="Open context menu"]'),
    ).not.toBeInTheDocument();
  });
});
