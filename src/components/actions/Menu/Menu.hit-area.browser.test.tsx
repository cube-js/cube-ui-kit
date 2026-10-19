import { Styles } from '@tenphi/tasty';
import { useState } from 'react';
import { cdp, userEvent } from 'vitest/browser';

import { FolderIcon } from '../../../icons/FolderIcon';
import { act, render, screen, waitFor } from '../../../test';
import { Root } from '../../Root';
import { CommandMenu } from '../CommandMenu/CommandMenu';

import { Menu } from './Menu';

function nativePosition(x: number, y: number) {
  const frame = window.frameElement as HTMLElement | null;
  const bounds = frame?.getBoundingClientRect();
  const scaleX = bounds && frame ? bounds.width / frame.offsetWidth : 1;
  const scaleY = bounds && frame ? bounds.height / frame.offsetHeight : 1;
  return {
    x: (bounds?.left ?? 0) + (x + (frame?.clientLeft ?? 0)) * scaleX,
    y: (bounds?.top ?? 0) + (y + (frame?.clientTop ?? 0)) * scaleY,
  };
}

async function pressAt(
  x: number,
  y: number,
  button: 'left' | 'right' | 'middle' = 'left',
  modifiers = 0,
) {
  const position = nativePosition(x, y);
  await act(async () => {
    await cdp().send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button,
      buttons: button === 'left' ? 1 : button === 'right' ? 2 : 4,
      clickCount: 1,
      modifiers,
      ...position,
    });
    await cdp().send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button,
      buttons: 0,
      clickCount: 1,
      modifiers,
      ...position,
    });
  });
}

function centreOf(element: Element) {
  const bounds = element.getBoundingClientRect();
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  };
}

const LONG_LABEL =
  'Quarterly revenue by region and product line for the whole fiscal year';

const POINTER_TARGET_ROWS = [
  {
    row: 'link with an icon, a long label and a description',
    label: LONG_LABEL,
    link: true,
    icon: true,
    description:
      'Shared with the finance team and refreshed every morning before nine',
  },
  {
    row: 'heading link with an icon',
    label: LONG_LABEL,
    link: true,
    icon: true,
    type: 'header',
  },
  { row: 'link with a short label', label: 'Browse', link: true },
  { row: 'command with an inline action', label: LONG_LABEL, inline: true },
] as const;

describe('Native menu row hit area', () => {
  it.each(
    (['Menu', 'CommandMenu'] as const).flatMap((owner) =>
      POINTER_TARGET_ROWS
        // Inline actions are unsupported with CommandMenu's virtual focus.
        .filter((row) => owner === 'Menu' || !('inline' in row))
        .map((row) => ({ owner, ...row })),
    ),
  )(
    'makes the primary menuitem the pointer target of a $owner $row',
    async (row) => {
      const navigate = vi.fn();
      const itemAction = vi.fn();
      const menuAction = vi.fn();
      const inline = vi.fn();
      const destination = '/__menu-link-test/primary-pointer-target';
      const item = {
        to: 'link' in row ? destination : undefined,
        tooltip: false,
        icon: 'icon' in row ? <FolderIcon /> : undefined,
        description: 'description' in row ? row.description : undefined,
        type: 'type' in row ? row.type : undefined,
        onAction: itemAction,
        actions:
          'inline' in row ? (
            <Menu.Item.Action aria-label="Delete workbook" onPress={inline}>
              Delete
            </Menu.Item.Action>
          ) : undefined,
      };
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          {row.owner === 'Menu' ? (
            <Menu
              aria-label="Workbooks"
              styles={{ width: '36x' }}
              onAction={menuAction}
            >
              <Menu.Item key="target" {...item}>
                {row.label}
              </Menu.Item>
            </Menu>
          ) : (
            <CommandMenu width="36x" onAction={menuAction}>
              <CommandMenu.Item key="target" {...item}>
                {row.label}
              </CommandMenu.Item>
            </CommandMenu>
          )}
        </Root>,
      );
      const primary = screen.getByRole('menuitem', { name: row.label });
      const listItem = primary.closest('li')!;
      await userEvent.hover(listItem);
      await waitFor(
        () => {
          const { x, y } = centreOf(primary);
          expect(primary.contains(document.elementFromPoint(x, y))).toBe(true);
        },
        { timeout: 1000 },
      );
      // Every visible content cell yields to the primary anchor, whatever its
      // length, so a press on the text lands where a role locator aims.
      const cells = listItem.querySelectorAll(
        ':scope > :is([data-element=Icon], [data-element=Label], [data-element=Description])',
      );
      expect(cells).toHaveLength(
        1 + ('icon' in row ? 1 : 0) + ('description' in row ? 1 : 0),
      );
      for (const cell of Array.from(cells)) {
        const { x, y } = centreOf(cell);
        expect(
          primary.contains(document.elementFromPoint(x, y)),
          `${cell.getAttribute('data-element')} centre`,
        ).toBe(true);
      }
      // A role-based click passes Playwright's hit-target check.
      await userEvent.click(primary, { timeout: 2000 });
      expect(itemAction).toHaveBeenCalledTimes(1);
      expect(menuAction).toHaveBeenCalledExactlyOnceWith('target');
      if ('link' in row) {
        expect(navigate).toHaveBeenCalledExactlyOnceWith(
          destination,
          undefined,
        );
      } else {
        expect(navigate).not.toHaveBeenCalled();
      }
      if ('inline' in row) {
        await userEvent.click(
          screen.getByRole('menuitem', { name: 'Delete workbook' }),
        );
        expect(inline).toHaveBeenCalledTimes(1);
        expect(itemAction).toHaveBeenCalledTimes(1);
        expect(menuAction).toHaveBeenCalledTimes(1);
      }
    },
  );

  it.each(['Menu', 'CommandMenu'] as const)(
    'opens the auto tooltip of a truncated %s link over its label',
    async (owner) => {
      render(
        <Root>
          {owner === 'Menu' ? (
            <Menu aria-label="Workbooks" styles={{ width: '36x' }}>
              <Menu.Item key="browse" to="/__menu-link-test/auto-tooltip">
                {LONG_LABEL}
              </Menu.Item>
            </Menu>
          ) : (
            <CommandMenu width="36x">
              <CommandMenu.Item
                key="browse"
                to="/__menu-link-test/auto-tooltip"
              >
                {LONG_LABEL}
              </CommandMenu.Item>
            </CommandMenu>
          )}
        </Root>,
      );
      const primary = screen.getByRole('menuitem', { name: LONG_LABEL });
      const label = primary
        .closest('li')!
        .querySelector(':scope > [data-element=Label]')!;
      // Raw pointer moves land on the label's centre, whatever is on top.
      for (const point of [{ x: 1, y: 1 }, centreOf(label)]) {
        await act(async () => {
          await cdp().send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            ...nativePosition(point.x, point.y),
          });
        });
      }
      await waitFor(
        () =>
          expect(
            Array.from(document.querySelectorAll('[role="tooltip"]')).some(
              (tip) => tip.textContent === LONG_LABEL,
            ),
          ).toBe(true),
        { timeout: 2000 },
      );
    },
  );

  it.each(['modified', 'middle', 'context'] as const)(
    'hands a native %s press on the label to the primary link',
    async (gesture) => {
      const navigate = vi.fn();
      const onAction = vi.fn();
      const destination = '/__menu-link-test/label-native-' + gesture;
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu
            aria-label="Workbooks"
            styles={{ width: '36x' }}
            onAction={onAction}
          >
            <Menu.Item
              key="browse"
              to={destination}
              icon={<FolderIcon />}
              tooltip={false}
            >
              {LONG_LABEL}
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const primary = screen.getByRole('menuitem', { name: LONG_LABEL });
      const listItem = primary.closest('li')!;
      await userEvent.hover(listItem);
      const { x, y } = centreOf(
        listItem.querySelector(':scope > [data-element=Label]')!,
      );
      const type =
        gesture === 'middle'
          ? 'auxclick'
          : gesture === 'context'
            ? 'contextmenu'
            : 'click';
      const events: MouseEvent[] = [];
      const record = (event: MouseEvent) => events.push(event);
      document.addEventListener(type, record, true);
      try {
        await pressAt(
          x,
          y,
          gesture === 'middle'
            ? 'middle'
            : gesture === 'context'
              ? 'right'
              : 'left',
          gesture === 'modified' ? 4 : 0,
        );
        expect(events).toHaveLength(1);
        expect(events[0].isTrusted).toBe(true);
        expect(events[0].defaultPrevented).toBe(false);
        expect(events[0].target).toBe(primary);
        expect(primary).toHaveAttribute('href', destination);
        expect(navigate).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(gesture === 'modified' ? 1 : 0);
        if (gesture !== 'context') {
          await waitFor(async () => {
            const requests: { url: string }[] = await (
              await fetch('/__menu-link-test/requests')
            ).json();
            expect(
              requests.some((request) => request.url === destination),
            ).toBe(true);
          });
        }
      } finally {
        document.removeEventListener(type, record, true);
      }
    },
  );

  it.each(['Menu', 'CommandMenu'] as const)(
    'exposes native link context commands in %s row whitespace',
    async (owner) => {
      const navigate = vi.fn();
      const onAction = vi.fn();
      const destination = '/__menu-link-test/row-whitespace';
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          {owner === 'Menu' ? (
            <Menu
              aria-label="Workbooks"
              styles={{ width: '36x' }}
              onAction={onAction}
            >
              <Menu.Item key="browse" to={destination} tooltip={false}>
                Browse all
              </Menu.Item>
            </Menu>
          ) : (
            <CommandMenu width="36x" onAction={onAction}>
              <CommandMenu.Item key="browse" to={destination} tooltip={false}>
                Browse all
              </CommandMenu.Item>
            </CommandMenu>
          )}
        </Root>,
      );
      const item = screen.getByRole('menuitem', { name: 'Browse all' });
      const row = item.closest('li')!;
      await userEvent.hover(row);
      const bounds = row.getBoundingClientRect();
      const text = document.createRange();
      text.selectNodeContents(screen.getByText('Browse all'));
      const textBounds = text.getBoundingClientRect();
      const nativeBounds = item.getBoundingClientRect();
      expect(nativeBounds.left).toBeCloseTo(bounds.left, 2);
      expect(nativeBounds.right).toBeCloseTo(bounds.right, 2);
      expect(nativeBounds.top).toBeCloseTo(bounds.top, 2);
      expect(nativeBounds.bottom).toBeCloseTo(bounds.bottom, 2);
      const x = bounds.right - 0.5;
      const y = bounds.top + bounds.height / 2;
      expect(x).toBeGreaterThan(textBounds.right + 8);
      const events: MouseEvent[] = [];
      const record = (event: MouseEvent) => events.push(event);
      document.addEventListener('contextmenu', record, true);
      try {
        await pressAt(x, y, 'right');
        expect(events).toHaveLength(1);
        expect(events[0].isTrusted).toBe(true);
        expect(events[0].defaultPrevented).toBe(false);
        expect((events[0].target as Element).closest('a')).toHaveAttribute(
          'href',
          destination,
        );
        expect(Math.abs(events[0].clientX - x)).toBeLessThan(1);
        expect(Math.abs(events[0].clientY - y)).toBeLessThan(1);
        expect(navigate).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('contextmenu', record, true);
      }
    },
  );
  it.each(['Menu', 'CommandMenu'] as const)(
    'routes an ordinary whitespace click once in %s, after both action callbacks',
    async (owner) => {
      const calls: string[] = [];
      const destination = '/__menu-link-test/ordinary-whitespace';
      const common = { onAction: (key: unknown) => calls.push(`menu:${key}`) };
      const item = {
        key: 'browse',
        to: destination,
        tooltip: false,
        onAction: () => calls.push('item'),
      };
      render(
        <Root
          navigation={{
            useHref: String,
            useNavigate: () => (to) => calls.push(`route:${to}`),
          }}
        >
          {owner === 'Menu' ? (
            <Menu aria-label="Workbooks" {...common} styles={{ width: '36x' }}>
              <Menu.Item {...item}>Browse all</Menu.Item>
            </Menu>
          ) : (
            <CommandMenu {...common} width="36x">
              <CommandMenu.Item {...item}>Browse all</CommandMenu.Item>
            </CommandMenu>
          )}
        </Root>,
      );
      const row = screen
        .getByRole('menuitem', { name: 'Browse all' })
        .closest('li')!;
      await userEvent.hover(row);
      const bounds = row.getBoundingClientRect();
      await pressAt(bounds.right - 8, bounds.top + bounds.height / 2);
      expect(calls).toEqual(['item', 'menu:browse', `route:${destination}`]);
    },
  );

  it.each(['middle', 'modified'] as const)(
    'preserves the native %s whitespace gesture and action behavior',
    async (gesture) => {
      const navigate = vi.fn();
      const onAction = vi.fn();
      const onItemAction = vi.fn();
      const destination = '/__menu-link-test/native-whitespace-' + gesture;
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu
            aria-label="Workbooks"
            styles={{ width: '36x' }}
            onAction={onAction}
          >
            <Menu.Item
              key="browse"
              to={destination}
              onAction={onItemAction}
              tooltip={false}
            >
              Browse all
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen
        .getByRole('menuitem', { name: 'Browse all' })
        .closest('li')!;
      await userEvent.hover(row);
      const bounds = row.getBoundingClientRect();
      const events: MouseEvent[] = [];
      const type = gesture === 'middle' ? 'auxclick' : 'click';
      const record = (event: MouseEvent) => events.push(event);
      document.addEventListener(type, record, true);
      try {
        await pressAt(
          bounds.right - 8,
          bounds.top + bounds.height / 2,
          gesture === 'middle' ? 'middle' : 'left',
          gesture === 'modified' ? 4 : 0,
        );
        expect(events).toHaveLength(1);
        expect(events[0].isTrusted).toBe(true);
        expect(events[0].defaultPrevented).toBe(false);
        expect((events[0].target as Element).closest('a')).toHaveAttribute(
          'href',
          destination,
        );
        expect(navigate).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledTimes(gesture === 'modified' ? 1 : 0);
        expect(onItemAction).toHaveBeenCalledTimes(
          gesture === 'modified' ? 1 : 0,
        );
        if (gesture === 'modified') {
          expect(events[0].metaKey).toBe(true);
          expect(onAction).toHaveBeenCalledWith('browse');
        }
        await waitFor(async () => {
          const requests: { url: string }[] = await (
            await fetch('/__menu-link-test/requests')
          ).json();
          expect(requests.some((request) => request.url === destination)).toBe(
            true,
          );
        });
      } finally {
        document.removeEventListener(type, record, true);
      }
    },
  );

  it.each([
    ['padding and gaps', { padding: '2x', gap: '1x' }],
    [
      'positioned label with clipping',
      { Label: { position: 'relative', overflow: 'hidden' } },
    ],
    ['static grid', { position: 'static' }],
    ['static flex', { position: 'static', display: 'flex' }],
    ['static block', { position: 'static', display: 'block' }],
    [
      'block with gaps and border',
      { display: 'block', gap: '1x', border: '2bw solid #danger' },
    ],
  ] as const)(
    'covers the row with %s while preserving an independent inline action',
    async (_, styles) => {
      const navigate = vi.fn();
      const onAction = vi.fn();
      const inline = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu
            aria-label="Workbooks"
            styles={{ width: '36x' }}
            onAction={onAction}
          >
            <Menu.Item key="before" tooltip={false}>
              Before
            </Menu.Item>
            <Menu.Item
              key="browse"
              to="/__menu-link-test/custom-whitespace"
              tooltip={false}
              styles={styles as Styles}
              actions={
                <Menu.Item.Action aria-label="Delete workbook" onPress={inline}>
                  Delete
                </Menu.Item.Action>
              }
            >
              Browse all
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen
        .getByRole('menuitem', { name: 'Browse all' })
        .closest('li')!;
      await userEvent.hover(row);
      const bounds = row.getBoundingClientRect();
      const nativeBounds = screen
        .getByRole('menuitem', { name: 'Browse all' })
        .getBoundingClientRect();
      expect(nativeBounds.left).toBeCloseTo(bounds.left, 2);
      expect(nativeBounds.right).toBeCloseTo(bounds.right, 2);
      expect(nativeBounds.top).toBeCloseTo(bounds.top, 2);
      expect(nativeBounds.bottom).toBeCloseTo(bounds.bottom, 2);
      const action = screen.getByRole('menuitem', { name: 'Delete workbook' });
      const actionBounds = action.getBoundingClientRect();
      const x = bounds.left + bounds.width / 2;
      const y = bounds.top + 2;
      await waitFor(() =>
        expect(document.elementFromPoint(x, y)?.closest('a')).toHaveAttribute(
          'href',
          '/__menu-link-test/custom-whitespace',
        ),
      );
      const before = screen.getByRole('menuitem', { name: 'Before' });
      const beforeBounds = before.getBoundingClientRect();
      expect(
        document
          .elementFromPoint(
            beforeBounds.left + beforeBounds.width / 2,
            beforeBounds.top + beforeBounds.height / 2,
          )
          ?.closest('li'),
      ).toBe(before);
      await pressAt(
        actionBounds.left + actionBounds.width / 2,
        actionBounds.top + actionBounds.height / 2,
      );
      expect(inline).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
      expect(onAction).not.toHaveBeenCalled();
      await pressAt(x, y);
      expect(onAction).toHaveBeenCalledExactlyOnceWith('browse');
      expect(navigate).toHaveBeenCalledExactlyOnceWith(
        '/__menu-link-test/custom-whitespace',
        undefined,
      );
    },
  );

  it('follows a static row through scrolling and keeps its native target clipped to the menu', async () => {
    render(
      <Root>
        <Menu
          aria-label="Workbooks"
          styles={{ width: '36x', height: '8x', overflow: 'auto' }}
        >
          <Menu.Item key="before" tooltip={false}>
            Before
          </Menu.Item>
          <Menu.Item
            key="browse"
            to="/__menu-link-test/scrolled"
            tooltip={false}
            styles={{ position: 'static' }}
          >
            Browse all
          </Menu.Item>
          <Menu.Item key="after" tooltip={false}>
            After
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const menu = screen.getByRole('menu');
    const row = screen
      .getByRole('menuitem', { name: 'Browse all' })
      .closest('li')!;
    await act(() => {
      menu.scrollTop = 24;
    });
    await userEvent.hover(row);
    const bounds = row.getBoundingClientRect();
    await waitFor(() =>
      expect(
        document
          .elementFromPoint(bounds.right - 8, bounds.top + bounds.height / 2)
          ?.closest('a'),
      ).toHaveAttribute('href', '/__menu-link-test/scrolled'),
    );
    const clip = menu.getBoundingClientRect();
    expect(
      document
        .elementFromPoint(bounds.right - 8, clip.bottom + 8)
        ?.closest('a'),
    ).toBeNull();
  });

  it('keeps controls in prefix and suffix clickable and yields to an already mounted consumer pointer override', async () => {
    const prefix = vi.fn();
    const suffix = vi.fn();
    const ignored = vi.fn();
    const navigate = vi.fn();
    const itemAction = vi.fn();
    const menuAction = vi.fn();
    let reveal: (() => void) | undefined;
    function App() {
      const [visible, setVisible] = useState(false);
      reveal = () => setVisible(true);
      return (
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu.Item.Action styles={{ pointerEvents: 'none' }}>
            Warm ignored control
          </Menu.Item.Action>
          {visible && (
            <Menu
              aria-label="Workbooks"
              styles={{ width: '36x' }}
              onAction={menuAction}
            >
              <Menu.Item
                key="browse"
                to="/__menu-link-test/controls"
                tooltip={false}
                onAction={itemAction}
                prefix={<button onClick={prefix}>Prefix control</button>}
                suffix={
                  <input
                    aria-label="Suffix control"
                    type="checkbox"
                    onChange={suffix}
                  />
                }
                actions={
                  <Menu.Item.Action
                    aria-label="Ignored control"
                    styles={{ pointerEvents: 'none' }}
                    onPress={ignored}
                  >
                    Ignored
                  </Menu.Item.Action>
                }
              >
                Browse all
              </Menu.Item>
            </Menu>
          )}
        </Root>
      );
    }
    render(<App />);
    await act(() => reveal?.());
    const prefixControl = screen.getByRole('button', {
      name: 'Prefix control',
    });
    const prefixBounds = prefixControl.getBoundingClientRect();
    await pressAt(
      prefixBounds.left + prefixBounds.width / 2,
      prefixBounds.top + prefixBounds.height / 2,
    );
    expect(prefix).toHaveBeenCalledTimes(1);
    expect(itemAction).not.toHaveBeenCalled();
    expect(menuAction).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => {
      await userEvent.click(
        screen.getByRole('checkbox', { name: 'Suffix control' }),
      );
    });
    expect(suffix).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('checkbox', { name: 'Suffix control' }),
    ).toBeChecked();
    expect(itemAction).not.toHaveBeenCalled();
    expect(menuAction).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    const inert = screen.getByRole('menuitem', { name: 'Ignored control' });
    expect(getComputedStyle(inert).pointerEvents).toBe('none');
    const bounds = inert.getBoundingClientRect();
    await pressAt(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    expect(ignored).not.toHaveBeenCalled();
    expect(itemAction).toHaveBeenCalledTimes(1);
    expect(menuAction).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it.each(['prefix', 'suffix', 'actions'] as const)(
    'keeps a native checkbox label in %s independent from row activation',
    async (slot) => {
      const changed = vi.fn();
      const itemAction = vi.fn();
      const menuAction = vi.fn();
      const navigate = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu
            aria-label="Workbooks"
            styles={{ width: '36x' }}
            onAction={menuAction}
          >
            <Menu.Item
              key="saved"
              to="/__menu-link-test/label-control"
              tooltip={false}
              onAction={itemAction}
              {...{
                [slot]: (
                  <label>
                    <input
                      type="checkbox"
                      role="menuitemcheckbox"
                      tabIndex={-1}
                      onChange={changed}
                    />
                    <span>Select saved</span>
                  </label>
                ),
              }}
            >
              Saved workbook
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const text = screen.getByText('Select saved');
      const bounds = text.getBoundingClientRect();
      await pressAt(
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2,
      );
      const checkbox = screen.getByRole('menuitemcheckbox', {
        name: 'Select saved',
      });
      expect(checkbox).toBeChecked();
      expect(changed).toHaveBeenCalledTimes(1);
      await act(async () => userEvent.click(checkbox));
      expect(checkbox).not.toBeChecked();
      expect(changed).toHaveBeenCalledTimes(2);
      await act(() => checkbox.focus());
      await act(async () => userEvent.keyboard(' '));
      expect(checkbox).toBeChecked();
      expect(changed).toHaveBeenCalledTimes(3);
      expect(itemAction).not.toHaveBeenCalled();
      expect(menuAction).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it('preserves an implicit label for a custom inline menuitem button', async () => {
    const command = vi.fn();
    const itemAction = vi.fn();
    const menuAction = vi.fn();
    const navigate = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <Menu
          aria-label="Workbooks"
          styles={{ width: '36x' }}
          onAction={menuAction}
        >
          <Menu.Item
            key="saved"
            to="/__menu-link-test/button-label"
            tooltip={false}
            onAction={itemAction}
            actions={
              <label>
                <span>Delete saved</span>
                <button
                  role="menuitem"
                  tabIndex={-1}
                  aria-label="Delete saved workbook"
                  onClick={command}
                >
                  Delete
                </button>
              </label>
            }
          >
            Saved workbook
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const bounds = screen.getByText('Delete saved').getBoundingClientRect();
    await pressAt(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    expect(command).toHaveBeenCalledTimes(1);
    const button = screen.getByRole('menuitem', {
      name: 'Delete saved workbook',
    });
    expect(button).toHaveFocus();
    await act(async () => userEvent.keyboard('{Enter}'));
    expect(command).toHaveBeenCalledTimes(2);
    expect(itemAction).not.toHaveBeenCalled();
    expect(menuAction).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
