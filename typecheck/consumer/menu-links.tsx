import { Menu } from '@cube-dev/ui-kit';

import type { CubeMenuItemProps } from '@cube-dev/ui-kit';

const props: CubeMenuItemProps<{ id: string }> = {
  children: 'Workbook',
  to: { pathname: '../workbooks/42', search: '?chatId=abc', hash: '#results' },
  navigationOptions: {
    replace: true,
    state: { from: 'menu' },
    relative: 'path',
    preventScrollReset: true,
  },
  target: '_blank',
  rel: 'noopener',
};

const items = [{ id: 'workbook' }];

export function MenuLinksConsumer() {
  return (
    <Menu items={items} aria-label="Workbooks">
      {(item) => (
        <Menu.Item key={item.id} {...props}>
          {item.id}
        </Menu.Item>
      )}
    </Menu>
  );
}

export const nativeLink = (
  <Menu.Item href="/export.csv" download="workbook.csv">
    Export
  </Menu.Item>
);
export const newTab = <Menu.Item to="!/workbooks">Workbooks</Menu.Item>;
// History actions do not have native link destinations.
// @ts-expect-error Menu links take a string or Path rather than a history delta.
export const historyLink = <Menu.Item to={-1}>Back</Menu.Item>;
