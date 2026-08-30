import { Fragment, createElement as h } from 'react';

const BUTTON_THEMES = [
  'current',
  'default',
  'danger',
  'success',
  'warning',
  'note',
  'special',
];
const BUTTON_TYPES = ['primary', 'outline', 'outline-2', 'clear', 'link'];
const ITEM_ACTION_TYPES = ['primary', 'outline', 'clear'];

function group(...children) {
  return h(Fragment, null, ...children);
}

function matrix(Component, values, props = {}) {
  return values.map((value) =>
    h(Component, { ...props, ...value, key: JSON.stringify(value) }, 'Example'),
  );
}

function item(Component, key, label = String(key)) {
  return h(Component.Item, { key }, label);
}

function catalogCase(id, components, render, structuralReason) {
  return {
    id,
    components,
    structuralReason,
    async render() {
      try {
        const ui = await import('../dist/index.js');
        return h(
          ui.I18nProvider,
          null,
          h(ui.Provider, null, h(ui.OverlayProvider, null, render(ui))),
        );
      } catch (error) {
        throw new Error(`UI Kit precompile case "${id}" failed.`, {
          cause: error,
        });
      }
    },
  };
}

export const runtimeOnlyComponents = {
  AlertDialog:
    'Its styled subtree is mounted only after the imperative dialog state opens.',
  Board:
    'Its external store has no server snapshot and its layout is finalized from browser measurements.',
  BoardResponsive:
    'Its breakpoint selection requires ResizeObserver measurements.',
  BoardWidget:
    'It renders only inside Board, whose external store and geometry are runtime-only.',
  DialogContainer:
    'It mounts a portal only after controlled client state creates a dialog.',
  DialogForm:
    'It is covered structurally by Dialog and Form; submission state is runtime-only.',
  DialogTrigger:
    'Its dialog subtree is interaction-mounted; the trigger itself is supplied by the caller.',
  MenuTrigger:
    'Its menu subtree is interaction-mounted; Menu is cataloged directly.',
  Notification:
    'The declarative component registers with the notification store and returns null.',
  OverlayProvider:
    'It is a state provider; its styled overlay subtree is covered by notification cases.',
  Portal: 'It has no styles and needs a browser portal target.',
  Root: 'It intentionally renders dynamic GlobalStyles, which are excluded from this artifact.',
  SubMenuTrigger:
    'Its submenu subtree is interaction-mounted; Menu is cataloged directly.',
  Toast: 'The imperative component writes to the toast store and returns null.',
  TooltipProvider:
    'Its tooltip subtree is interaction-mounted; Tooltip is cataloged directly.',
  TooltipTrigger:
    'Its tooltip subtree is interaction-mounted; Tooltip is cataloged directly.',
};

export const publicStyledComponents = [
  'Action',
  'ActiveZone',
  'Alert',
  'AlertDialog',
  'Avatar',
  'Badge',
  'Banner',
  'BannerAction',
  'BannerLink',
  'Block',
  'Board',
  'BoardResponsive',
  'BoardWidget',
  'Button',
  'ButtonGroup',
  'ButtonSplit',
  'Card',
  'Checkbox',
  'CheckboxGroup',
  'ColorInput',
  'ColorPicker',
  'ColorSwatch',
  'ColorSwatchGroup',
  'ComboBox',
  'CommandMenu',
  'CommandTextArea',
  'Content',
  'CopyPasteBlock',
  'CopySnippet',
  'CubeFullLogo',
  'CubeLogo',
  'DataTable',
  'DateInput',
  'DatePicker',
  'DateRangePicker',
  'DateRangeSeparatedPicker',
  'Dialog',
  'DialogContainer',
  'DialogForm',
  'DialogTrigger',
  'Disclosure',
  'DisplayTransition',
  'Divider',
  'FileInput',
  'FilterListBox',
  'FilterPicker',
  'Flex',
  'Flow',
  'Footer',
  'Form',
  'Grid',
  'GridLayout',
  'GridProvider',
  'Header',
  'HotKeys',
  'HueSlider',
  'IconSwitch',
  'InfoBadge',
  'InlineInput',
  'Input',
  'Item',
  'ItemAction',
  'ItemBadge',
  'ItemButton',
  'ItemCard',
  'ItemTable',
  'Layout',
  'Link',
  'ListBox',
  'LoadingAnimation',
  'Menu',
  'MenuTrigger',
  'MonthPicker',
  'NoDataIcon',
  'Notification',
  'NotificationAction',
  'NotificationCard',
  'NotificationItem',
  'NumberInput',
  'OverlayProvider',
  'Pagination',
  'Panel',
  'Paragraph',
  'PasswordInput',
  'PeriodPicker',
  'PersistentNotificationsList',
  'Picker',
  'Placeholder',
  'Portal',
  'Prefix',
  'PrismCode',
  'PrismDiffCode',
  'QuarterPicker',
  'Radio',
  'RadioGroup',
  'RangeSlider',
  'ResizablePanel',
  'Result',
  'Root',
  'SearchComboBox',
  'SearchInput',
  'Select',
  'Skeleton',
  'Slider',
  'Space',
  'Spin',
  'StatsCard',
  'SubMenuTrigger',
  'Suffix',
  'Switch',
  'Tab',
  'Tabs',
  'TabsAction',
  'Tag',
  'Text',
  'TextArea',
  'TextInput',
  'TextInputMapper',
  'TextItem',
  'TimeInput',
  'Title',
  'Toast',
  'ToastItem',
  'Tooltip',
  'TooltipProvider',
  'TooltipTrigger',
  'Tree',
  'WeekPicker',
  'YearPicker',
];

export const cases = [
  catalogCase(
    'layout/primitives',
    [
      'Block',
      'Grid',
      'GridProvider',
      'Flex',
      'Space',
      'Flow',
      'Panel',
      'Prefix',
      'Suffix',
    ],
    (ui) =>
      group(
        h(ui.Block, null, 'Block'),
        h(ui.Grid, { columns: 2 }, h('span', null, 'A'), h('span', null, 'B')),
        h(ui.GridProvider, { initialWidth: '400px' }, 'Grid provider'),
        h(ui.Flex, null, 'Flex'),
        h(ui.Space, null, 'Space'),
        h(ui.Flow, null, 'Flow'),
        h(ui.Panel, null, 'Panel'),
        h(ui.Prefix, null, 'Prefix'),
        h(ui.Suffix, null, 'Suffix'),
      ),
  ),
  catalogCase(
    'layout/content',
    ['Content', 'Header', 'Footer', 'GridLayout', 'Layout'],
    (ui) =>
      group(
        h(ui.Content, null, 'Content'),
        h(ui.Header, null, 'Header'),
        h(ui.Footer, null, 'Footer'),
        h(ui.GridLayout, null, 'Grid layout'),
        h(
          ui.Layout,
          null,
          h(ui.Layout.Header, null, 'Header'),
          h(ui.Layout.Toolbar, null, 'Toolbar'),
          h(ui.Layout.Content, null, 'Content'),
          h(ui.Layout.Footer, null, 'Footer'),
        ),
      ),
  ),
  catalogCase(
    'typography/all',
    ['Text', 'TextItem', 'Title', 'Paragraph'],
    (ui) =>
      group(
        h(ui.Text, null, 'Text'),
        h(ui.TextItem, null, 'Text item'),
        h(ui.Title, null, 'Title'),
        h(ui.Paragraph, null, 'Paragraph'),
      ),
  ),
  catalogCase('action/base', ['Action', 'Link'], (ui) =>
    group(h(ui.Action, null, 'Action'), h(ui.Link, { href: '#' }, 'Link')),
  ),
  catalogCase('button/variants', ['Button'], (ui) =>
    group(
      ...matrix(
        ui.Button,
        BUTTON_THEMES.flatMap((theme) =>
          BUTTON_TYPES.map((type) => ({ theme, type })),
        ),
      ),
      ...matrix(ui.Button, [
        { size: 'xsmall' },
        { size: 'small' },
        { size: 'medium' },
        { size: 'large' },
        { size: 'xlarge' },
        { size: 'inline' },
        { isLoading: true },
        { isSelected: true },
      ]),
    ),
  ),
  catalogCase('button/compound', ['ButtonGroup', 'ButtonSplit'], (ui) =>
    group(
      h(
        ui.ButtonGroup,
        null,
        h(ui.Button, null, 'One'),
        h(ui.Button, null, 'Two'),
      ),
      h(ui.ButtonSplit, null, h(ui.Button, null, 'Split')),
    ),
  ),
  catalogCase('item-action/variants', ['ItemAction'], (ui) =>
    group(
      ...matrix(
        ui.ItemAction,
        BUTTON_THEMES.flatMap((theme) =>
          ITEM_ACTION_TYPES.map((type) => ({ theme, type })),
        ),
      ),
      h(ui.ItemAction, { icon: 'checkmark', isSelected: true }, 'Selected'),
      h(ui.ItemAction, { isLoading: true }, 'Loading'),
    ),
  ),
  catalogCase('item-badge/variants', ['ItemBadge'], (ui) =>
    group(
      ...matrix(
        ui.ItemBadge,
        ['current', 'default', 'danger', 'success', 'special'].flatMap(
          (theme) => ITEM_ACTION_TYPES.map((type) => ({ theme, type })),
        ),
      ),
    ),
  ),
  catalogCase('item/content', ['Item', 'ItemCard', 'ItemButton'], (ui) =>
    group(
      h(ui.Item, null, 'Item'),
      h(
        ui.Item,
        { icon: h(ui.InfoIcon), description: 'Description' },
        'Detailed',
      ),
      h(ui.ItemCard, null, 'Card item'),
      h(ui.ItemButton, null, 'Button item'),
    ),
  ),
  catalogCase(
    'banner/variants',
    ['Banner', 'BannerAction', 'BannerLink'],
    (ui) =>
      group(
        ...['note', 'success', 'warning', 'danger'].map((theme) =>
          h(
            ui.Banner,
            { key: theme, theme },
            `${theme} banner`,
            h(ui.BannerAction, null, 'Action'),
            h(ui.BannerLink, { href: '#' }, 'Link'),
          ),
        ),
      ),
  ),
  catalogCase('content/surfaces', ['Card', 'ActiveZone', 'Divider'], (ui) =>
    group(
      h(ui.Card, null, 'Card'),
      h(ui.ActiveZone, null, 'Active zone'),
      h(ui.Divider),
    ),
  ),
  catalogCase('content/status', ['Alert', 'Badge', 'Tag', 'Result'], (ui) =>
    group(
      ...['note', 'success', 'warning', 'danger'].flatMap((theme) => [
        h(ui.Alert, { key: `alert-${theme}`, theme }, `${theme} alert`),
        h(ui.Badge, { key: `badge-${theme}`, theme }, theme),
        h(ui.Tag, { key: `tag-${theme}`, theme }, theme),
      ]),
      h(ui.Alert, { shape: 'sharp' }, 'Sharp alert'),
      h(ui.Result, { status: 'success', title: 'Complete' }),
    ),
  ),
  catalogCase(
    'content/feedback',
    ['Avatar', 'InfoBadge', 'Placeholder', 'Skeleton'],
    (ui) =>
      group(
        h(ui.Avatar, { name: 'Ada Lovelace' }),
        h(ui.InfoBadge, null, 'Information'),
        h(ui.Placeholder),
        h(ui.Placeholder, { circle: true, isStatic: true }),
        h(ui.Skeleton, null, h(ui.Skeleton.Text, { lines: 2 })),
      ),
  ),
  catalogCase('content/code', ['PrismCode', 'PrismDiffCode'], (ui) =>
    group(
      h(ui.PrismCode, { code: 'const value = 1;', language: 'javascript' }),
      h(ui.PrismDiffCode, {
        original: 'const value = 1;',
        modified: 'const value = 2;',
        language: 'javascript',
      }),
    ),
  ),
  catalogCase('content/copy', ['CopySnippet', 'CopyPasteBlock'], (ui) =>
    group(
      h(ui.CopySnippet, { text: 'copy me' }),
      h(ui.CopyPasteBlock, { value: 'copy me' }),
    ),
  ),
  catalogCase('content/inline', ['InlineInput', 'HotKeys'], (ui) =>
    group(
      h(ui.InlineInput, { defaultValue: 'Editable' }),
      h(ui.HotKeys, null, '⌘ K'),
    ),
  ),
  catalogCase('content/disclosure', ['Disclosure'], (ui) =>
    h(
      ui.Disclosure.Group,
      { defaultExpandedKeys: ['one'] },
      h(ui.Disclosure, { id: 'one', title: 'Details' }, 'Expanded content'),
      h(ui.Disclosure, { id: 'two', title: 'More' }, 'More content'),
    ),
  ),
  catalogCase('content/tree', ['Tree'], (ui) =>
    h(ui.Tree, {
      treeData: [
        {
          key: 'src',
          title: 'src',
          children: [
            { key: 'index', title: 'index.ts' },
            { key: 'button', title: 'Button.tsx' },
          ],
        },
      ],
      defaultExpandedKeys: ['src'],
      isCheckable: true,
    }),
  ),
  catalogCase(
    'field/text',
    ['Input', 'TextInput', 'TextArea', 'PasswordInput'],
    (ui) =>
      group(
        h(ui.Input, { 'aria-label': 'Input', defaultValue: 'Value' }),
        h(ui.TextInput, { label: 'Text input', defaultValue: 'Value' }),
        h(ui.TextArea, { label: 'Text area', defaultValue: 'Value' }),
        h(ui.PasswordInput, { label: 'Password', defaultValue: 'secret' }),
      ),
  ),
  catalogCase('field/search-number', ['SearchInput', 'NumberInput'], (ui) =>
    group(
      h(ui.SearchInput, { 'aria-label': 'Search', defaultValue: 'Query' }),
      h(ui.NumberInput, { label: 'Count', defaultValue: 42 }),
    ),
  ),
  catalogCase(
    'field/choice',
    ['Checkbox', 'CheckboxGroup', 'Radio', 'RadioGroup', 'Switch'],
    (ui) =>
      group(
        h(ui.Checkbox, { defaultSelected: true }, 'Checkbox'),
        h(
          ui.CheckboxGroup,
          { label: 'Checkbox group', defaultValue: ['one'] },
          h(ui.Checkbox, { value: 'one' }, 'One'),
          h(ui.Checkbox, { value: 'two' }, 'Two'),
        ),
        h(
          ui.RadioGroup,
          { label: 'Radio group', defaultValue: 'one' },
          h(ui.Radio, { value: 'one' }, 'One'),
          h(ui.Radio, { value: 'two' }, 'Two'),
        ),
        h(ui.Switch, { defaultSelected: true }, 'Switch'),
      ),
  ),
  catalogCase('field/slider', ['Slider', 'RangeSlider', 'HueSlider'], (ui) =>
    group(
      h(ui.Slider, { label: 'Slider', defaultValue: 40 }),
      h(ui.RangeSlider, { label: 'Range', defaultValue: [20, 80] }),
      h(ui.HueSlider, { 'aria-label': 'Hue', defaultValue: 180 }),
    ),
  ),
  catalogCase('field/select', ['Select', 'ListBox'], (ui) =>
    group(
      h(
        ui.Select,
        { label: 'Select', defaultSelectedKey: 'one' },
        item(ui.Select, 'one', 'One'),
        item(ui.Select, 'two', 'Two'),
      ),
      h(
        ui.ListBox,
        { 'aria-label': 'List box', selectionMode: 'single' },
        item(ui.ListBox, 'one', 'One'),
        item(ui.ListBox, 'two', 'Two'),
      ),
    ),
  ),
  catalogCase(
    'field/combo',
    ['ComboBox', 'SearchComboBox'],
    (ui) =>
      group(
        h(
          ui.ComboBox,
          { label: 'Combo box' },
          item(ui.ComboBox, 'one', 'One'),
          item(ui.ComboBox, 'two', 'Two'),
        ),
        h(
          ui.SearchComboBox,
          { label: 'Search combo' },
          item(ui.SearchComboBox, 'one', 'One'),
          item(ui.SearchComboBox, 'two', 'Two'),
        ),
      ),
    'Retained as the required public defaults; their styled input and list primitives are already introduced by earlier field cases.',
  ),
  catalogCase(
    'field/pickers',
    ['Picker', 'FilterPicker', 'FilterListBox'],
    (ui) =>
      group(
        h(
          ui.Picker,
          { label: 'Picker', defaultSelectedKey: 'one' },
          item(ui.Picker, 'one', 'One'),
          item(ui.Picker, 'two', 'Two'),
        ),
        h(
          ui.FilterPicker,
          { label: 'Filter picker', defaultSelectedKeys: ['one'] },
          item(ui.FilterPicker, 'one', 'One'),
          item(ui.FilterPicker, 'two', 'Two'),
        ),
        h(
          ui.FilterListBox,
          { 'aria-label': 'Filter list', defaultSelectedKeys: ['one'] },
          item(ui.FilterListBox, 'one', 'One'),
          item(ui.FilterListBox, 'two', 'Two'),
        ),
      ),
  ),
  catalogCase(
    'field/color',
    ['ColorInput', 'ColorPicker', 'ColorSwatch', 'ColorSwatchGroup'],
    (ui) =>
      group(
        h(ui.ColorInput, { label: 'Color', defaultValue: '#7a4dbf' }),
        h(ui.ColorPicker, { label: 'Color picker', defaultValue: '#7a4dbf' }),
        h(ui.ColorSwatch, { color: '#7a4dbf' }),
        h(
          ui.ColorSwatchGroup,
          { 'aria-label': 'Colors', defaultValue: '#7a4dbf' },
          h(ui.ColorSwatch, { color: '#7a4dbf' }),
          h(ui.ColorSwatch, { color: '#26fcb2' }),
        ),
      ),
  ),
  catalogCase('field/date-inputs', ['DateInput', 'TimeInput'], (ui) => {
    const date = new ui.CalendarDate(2026, 8, 30);
    return group(
      h(ui.DateInput, { label: 'Date', defaultValue: date }),
      h(ui.TimeInput, { label: 'Time' }),
    );
  }),
  catalogCase(
    'field/date-pickers',
    ['DatePicker', 'DateRangePicker', 'DateRangeSeparatedPicker'],
    (ui) => {
      const start = new ui.CalendarDate(2026, 8, 30);
      const end = new ui.CalendarDate(2026, 9, 2);
      return group(
        h(ui.DatePicker, { label: 'Date picker', defaultValue: start }),
        h(ui.DateRangePicker, { label: 'Range', defaultValue: { start, end } }),
        h(ui.DateRangeSeparatedPicker, {
          label: 'Separated range',
          defaultValue: { start, end },
        }),
      );
    },
  ),
  catalogCase(
    'field/period-pickers',
    [
      'PeriodPicker',
      'MonthPicker',
      'QuarterPicker',
      'WeekPicker',
      'YearPicker',
    ],
    (ui) => {
      const date = new ui.CalendarDate(2026, 8, 30);
      return group(
        h(ui.PeriodPicker, { label: 'Period', defaultValue: date }),
        h(ui.MonthPicker, { label: 'Month', defaultValue: date }),
        h(ui.QuarterPicker, { label: 'Quarter', defaultValue: date }),
        h(ui.WeekPicker, { label: 'Week', defaultValue: date }),
        h(ui.YearPicker, { label: 'Year', defaultValue: date }),
      );
    },
  ),
  catalogCase('field/file-command', ['FileInput', 'CommandTextArea'], (ui) =>
    group(
      h(ui.FileInput, { label: 'File' }),
      h(ui.CommandTextArea, { label: 'Command', commands: [] }),
    ),
  ),
  catalogCase('field/mapper', ['TextInputMapper'], (ui) =>
    h(ui.TextInputMapper, { label: 'Mapper', defaultValue: [] }),
  ),
  catalogCase('form/default', ['Form'], (ui) =>
    h(ui.Form, null, h(ui.TextInput, { name: 'name', label: 'Name' })),
  ),
  catalogCase('navigation/tabs', ['Tabs', 'Tab', 'TabsAction'], (ui) =>
    h(
      ui.Tabs,
      { defaultSelectedKey: 'one' },
      h(ui.Tab, { id: 'one', title: 'One' }, 'First panel'),
      h(ui.Tab, { id: 'two', title: 'Two' }, 'Second panel'),
      h(ui.TabsAction, null, 'Action'),
    ),
  ),
  catalogCase('navigation/pagination', ['Pagination'], (ui) =>
    h(ui.Pagination, { page: 2, total: 10, onChange: () => {} }),
  ),
  catalogCase('overlay/menu', ['Menu', 'CommandMenu'], (ui) =>
    group(
      h(
        ui.Menu,
        { 'aria-label': 'Menu' },
        item(ui.Menu, 'one', 'One'),
        item(ui.Menu, 'two', 'Two'),
      ),
      h(ui.CommandMenu, { items: [{ id: 'one', name: 'One' }] }),
    ),
  ),
  catalogCase('overlay/dialog', ['Dialog'], (ui) =>
    h(ui.Dialog, { title: 'Dialog' }, 'Dialog content'),
  ),
  catalogCase('overlay/tooltip', ['Tooltip'], (ui) =>
    group(
      h(ui.Tooltip, null, 'Tooltip'),
      h(ui.Tooltip, { type: 'light' }, 'Light tooltip'),
    ),
  ),
  catalogCase(
    'notification/cards',
    [
      'NotificationCard',
      'NotificationItem',
      'NotificationAction',
      'PersistentNotificationsList',
      'ToastItem',
    ],
    (ui) =>
      group(
        h(ui.NotificationCard, {
          id: 'notice',
          title: 'Notification',
          description: 'Description',
        }),
        h(ui.NotificationItem, {
          notification: {
            id: 'item',
            internalId: 'item',
            title: 'Item',
            description: 'Description',
          },
          onDismiss: () => {},
        }),
        h(ui.NotificationAction, null, 'Action'),
        h(ui.PersistentNotificationsList, { emptyState: 'No notifications' }),
        h(ui.ToastItem, { title: 'Toast', description: 'Description' }),
      ),
  ),
  catalogCase('status/all', ['Spin', 'LoadingAnimation'], (ui) =>
    group(h(ui.Spin), h(ui.LoadingAnimation)),
  ),
  catalogCase('other/logos', ['CubeLogo', 'CubeFullLogo', 'NoDataIcon'], (ui) =>
    group(h(ui.CubeLogo), h(ui.CubeFullLogo), h(ui.NoDataIcon)),
  ),
  catalogCase(
    'helpers/all',
    ['DisplayTransition', 'IconSwitch'],
    (ui) =>
      group(
        h(
          ui.DisplayTransition,
          { isShown: true, animateOnMount: false },
          ({ phase, ref }) => h('div', { ref, 'data-phase': phase }, 'Visible'),
        ),
        h(ui.IconSwitch, null, h(ui.InfoIcon)),
      ),
    'Retained as the required public defaults; DisplayTransition is style-free and IconSwitch is already covered inside earlier components.',
  ),
  catalogCase('organism/stats-card', ['StatsCard'], (ui) =>
    h(ui.StatsCard, { title: 'Revenue', value: '$42k' }),
  ),
  catalogCase('layout/resizable-panel', ['ResizablePanel'], (ui) =>
    h(ui.ResizablePanel, { size: 240 }, 'Resizable'),
  ),
  catalogCase('data/tables', ['DataTable', 'ItemTable'], (ui) => {
    const data = [
      { id: 'one', name: 'Alpha', count: 42 },
      { id: 'two', name: 'Beta', count: 7 },
    ];
    const columns = [
      { key: 'name', title: 'Name', isRowHeader: true },
      { key: 'count', title: 'Count', dataType: 'number' },
    ];
    return group(
      h(ui.DataTable, {
        data,
        columns,
        ariaLabel: 'Data table',
        isLoading: true,
      }),
      h(ui.ItemTable, { data, columns, ariaLabel: 'Item table' }),
    );
  }),
];

const coveredComponents = new Set(cases.flatMap((item) => item.components));
const missingComponents = publicStyledComponents.filter(
  (name) => !coveredComponents.has(name) && !(name in runtimeOnlyComponents),
);

if (missingComponents.length > 0) {
  throw new Error(
    `Precompiled catalog coverage is missing: ${missingComponents.join(', ')}`,
  );
}
