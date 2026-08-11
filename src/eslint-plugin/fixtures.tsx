import { ItemActionProvider } from '../components/actions/ItemActionContext';
import {
  Alert,
  AlertDialog,
  Avatar,
  Badge,
  Banner,
  Board,
  Button,
  ButtonSplit,
  Checkbox,
  ComboBox,
  CommandMenu,
  CommandTextArea,
  CopyPasteBlock,
  CopySnippet,
  DataTable,
  DatePicker,
  Dialog,
  DialogContainer,
  DialogForm,
  DialogTrigger,
  Disclosure,
  DisplayTransition,
  FileInput,
  FilterListBox,
  FilterPicker,
  Form,
  GridProvider,
  HotKeys,
  HueSlider,
  InfoBadge,
  InlineInput,
  Item,
  ItemAction,
  ItemBadge,
  ItemButton,
  ItemCard,
  ItemTable,
  Layout,
  ListBox,
  LoadingAnimation,
  Menu,
  MenuTrigger,
  NumberInput,
  Pagination,
  PasswordInput,
  Picker,
  Placeholder,
  Portal,
  Prefix,
  PrismCode,
  Radio,
  RadioGroup,
  ResizablePanel,
  Result,
  SearchComboBox,
  SearchInput,
  Select,
  Skeleton,
  Slider,
  Space,
  Spin,
  Suffix,
  Switch,
  Tab,
  Tabs,
  Tag,
  Text,
  TextArea,
  TextInput,
  TextInputMapper,
  TextItem,
  Title,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  Tree,
} from '../index';

import { Fixture } from './probe';

/**
 * Render fixtures for the prover.
 *
 * Each fixture supplies whatever a component needs to render at all (required
 * props, collection children, wrappers) and merges the probed prop on top.
 * Components without a fixture are recorded as `skip: 'no-fixture'` rather than
 * silently omitted, so registry coverage is always explicit.
 *
 * `conditions` are where accuracy comes from: any prop whose redundancy verdict
 * changes under one of them is excluded from the rule.
 */

/** A `<Form orientation="horizontal">` supplies `labelPosition` to every field. */
const insideHorizontalForm = {
  label: 'inside <Form orientation="horizontal">',
  wrap: (ui: React.ReactElement) => <Form orientation="horizontal">{ui}</Form>,
};

/**
 * `Item` and `Badge` render `aria-selected={isSelected}`, so omitting the prop
 * drops the attribute entirely while `isSelected={false}` emits
 * `aria-selected="false"`. Assistive tech treats those differently, so the
 * explicit `false` is load-bearing even though it equals the default.
 */
const ARIA_SELECTED_SKIP = {
  reason: 'reflected-attribute' as const,
  note: 'Reflected as `aria-selected={isSelected}`, so omitting the prop removes the attribute while `false` emits `aria-selected="false"`. Not safe to strip.',
};

export const FIXTURES: Fixture[] = [
  {
    name: 'Button',
    render: (props) => <Button {...props}>Label</Button>,
    conditions: [
      // Button's `size` default is `type === 'link' ? 'inline' : 'medium'`.
      { label: 'type="link"', props: { type: 'link' } },
      { label: 'theme="special"', props: { theme: 'special' } },
    ],
  },
  {
    name: 'Item',
    render: (props) => <Item {...props}>Label</Item>,
    conditions: [
      {
        label: 'inside <ItemActionProvider theme="danger">',
        wrap: (ui) => (
          <ItemActionProvider theme="danger">{ui}</ItemActionProvider>
        ),
      },
      { label: 'type="card"', props: { type: 'card' } },
    ],
    curatedSkips: { isSelected: ARIA_SELECTED_SKIP },
  },
  {
    name: 'Badge',
    render: (props) => <Badge {...props}>1</Badge>,
    curatedSkips: { isSelected: ARIA_SELECTED_SKIP },
  },
  {
    name: 'Alert',
    render: (props) => <Alert {...props}>Message</Alert>,
    conditions: [{ label: 'isDisabled', props: { isDisabled: true } }],
  },
  {
    name: 'Switch',
    render: (props) => <Switch label="Switch" {...props} />,
    conditions: [insideHorizontalForm],
    ignoreProps: ['label'],
  },
  {
    name: 'TextInput',
    render: (props) => <TextInput label="Input" {...props} />,
    conditions: [insideHorizontalForm],
    ignoreProps: ['label'],
  },
  {
    name: 'Select',
    render: (props) => (
      <Select label="Select" {...props}>
        <Select.Item key="1">Blue</Select.Item>
        <Select.Item key="2">Red</Select.Item>
      </Select>
    ),
    conditions: [insideHorizontalForm],
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'Menu',
    render: (props) => (
      <Menu {...props}>
        <Menu.Item key="a">A</Menu.Item>
        <Menu.Item key="b">B</Menu.Item>
      </Menu>
    ),
    ignoreProps: ['children'],
  },
  {
    name: 'Tabs',
    render: (props) => (
      <Tabs defaultActiveKey="tab1" {...props}>
        <Tab key="tab1" title="Tab 1">
          Content 1
        </Tab>
        <Tab key="tab2" title="Tab 2">
          Content 2
        </Tab>
      </Tabs>
    ),
    ignoreProps: ['children', 'defaultActiveKey'],
    curatedSkips: {
      // The real default is `medium` (TabButton: `tabData.size ?? size ??
      // 'medium'`) and it does not vary by `type`. But Tabs renders
      // `data-size={size}`, so passing the default still changes the DOM.
      size: {
        reason: 'reflected-attribute',
        note: "Default is 'medium', but Tabs renders `data-size={size}`, so omitting the prop drops the attribute while 'medium' emits it. Not lintable.",
      },
    },
  },
  {
    name: 'Dialog',
    render: (props) => <Dialog {...props}>Dialog content</Dialog>,
    // Dialog normalises S/M/L onto small/medium/large through a lookup table
    // (Dialog.tsx), so `medium` really is the `M` default spelled differently.
    curatedAliases: { size: ['medium'] },
  },

  /* ── Content ──────────────────────────────────────────────────────────── */
  {
    name: 'Tag',
    render: (props) => <Tag {...props}>Tag</Tag>,
    // Tag and Banner both render through `Item`, which reflects `aria-selected`.
    curatedSkips: { isSelected: ARIA_SELECTED_SKIP },
  },
  {
    name: 'Banner',
    render: (props) => <Banner {...props}>Message</Banner>,
    curatedSkips: { isSelected: ARIA_SELECTED_SKIP },
  },
  { name: 'InfoBadge', render: (props) => <InfoBadge {...props}>1</InfoBadge> },
  {
    name: 'ItemBadge',
    render: (props) => <ItemBadge {...props}>1</ItemBadge>,
    curatedSkips: { isSelected: ARIA_SELECTED_SKIP },
  },
  {
    name: 'ItemButton',
    render: (props) => <ItemButton {...props}>Label</ItemButton>,
    conditions: [
      {
        label: 'inside <ItemActionProvider theme="danger">',
        wrap: (ui) => (
          <ItemActionProvider theme="danger">{ui}</ItemActionProvider>
        ),
      },
    ],
  },
  {
    name: 'ItemAction',
    render: (props) => <ItemAction {...props}>Label</ItemAction>,
    conditions: [
      {
        label: 'inside <ItemActionProvider theme="danger">',
        wrap: (ui) => (
          <ItemActionProvider theme="danger">{ui}</ItemActionProvider>
        ),
      },
    ],
  },
  { name: 'TextItem', render: (props) => <TextItem {...props}>Text</TextItem> },
  { name: 'Text', render: (props) => <Text {...props}>Text</Text> },
  { name: 'Title', render: (props) => <Title {...props}>Title</Title> },
  { name: 'Result', render: (props) => <Result title="Done" {...props} /> },
  { name: 'Skeleton', render: (props) => <Skeleton {...props} /> },
  {
    name: 'CopySnippet',
    render: (props) => <CopySnippet code="npm install" {...props} />,
    ignoreProps: ['code'],
  },
  {
    name: 'HotKeys',
    render: (props) => <HotKeys {...props}>mod+k</HotKeys>,
    curatedSkips: {
      // `type` has no destructuring default and is rendered as
      // `data-type={type}`, so omitting it leaves the attribute off entirely.
      type: {
        reason: 'reflected-attribute',
        note: 'Rendered as `data-type={type}` with no default, so omitting the prop drops the attribute while "default" emits it.',
      },
    },
  },
  { name: 'Placeholder', render: (props) => <Placeholder {...props} /> },
  { name: 'Avatar', render: (props) => <Avatar {...props}>A</Avatar> },
  { name: 'Layout', render: (props) => <Layout {...props}>Content</Layout> },
  {
    name: 'Disclosure',
    render: (props) => (
      <Disclosure title="Title" {...props}>
        Content
      </Disclosure>
    ),
  },
  { name: 'Spin', render: (props) => <Spin {...props} /> },

  /* ── Fields ───────────────────────────────────────────────────────────── */
  {
    name: 'Checkbox',
    render: (props) => <Checkbox label="Checkbox" {...props} />,
    conditions: [insideHorizontalForm],
    ignoreProps: ['label'],
  },
  {
    name: 'NumberInput',
    render: (props) => <NumberInput label="Number" {...props} />,
    conditions: [insideHorizontalForm],
    ignoreProps: ['label'],
  },
  {
    name: 'TextArea',
    render: (props) => <TextArea label="Text" {...props} />,
    conditions: [insideHorizontalForm],
    ignoreProps: ['label'],
  },
  {
    name: 'PasswordInput',
    render: (props) => <PasswordInput label="Password" {...props} />,
    conditions: [insideHorizontalForm],
    ignoreProps: ['label'],
  },
  {
    name: 'SearchInput',
    render: (props) => <SearchInput label="Search" {...props} />,
    conditions: [insideHorizontalForm],
    ignoreProps: ['label'],
  },
  {
    name: 'Slider',
    render: (props) => <Slider label="Slider" {...props} />,
    conditions: [insideHorizontalForm],
    ignoreProps: ['label'],
  },
  {
    name: 'RadioGroup',
    render: (props) => (
      <RadioGroup label="Radio" {...props}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>
    ),
    conditions: [insideHorizontalForm],
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'ListBox',
    render: (props) => (
      <ListBox label="ListBox" {...props}>
        <ListBox.Item key="1">Blue</ListBox.Item>
        <ListBox.Item key="2">Red</ListBox.Item>
      </ListBox>
    ),
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'ComboBox',
    render: (props) => (
      <ComboBox label="ComboBox" {...props}>
        <ComboBox.Item key="1">Blue</ComboBox.Item>
        <ComboBox.Item key="2">Red</ComboBox.Item>
      </ComboBox>
    ),
    conditions: [insideHorizontalForm],
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'Picker',
    render: (props) => (
      <Picker label="Picker" {...props}>
        <Picker.Item key="1">Blue</Picker.Item>
        <Picker.Item key="2">Red</Picker.Item>
      </Picker>
    ),
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'FilterPicker',
    render: (props) => (
      <FilterPicker label="Filter" {...props}>
        <FilterPicker.Item key="1">Blue</FilterPicker.Item>
        <FilterPicker.Item key="2">Red</FilterPicker.Item>
      </FilterPicker>
    ),
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'FilterListBox',
    render: (props) => (
      <FilterListBox label="Filter" {...props}>
        <FilterListBox.Item key="1">Blue</FilterListBox.Item>
        <FilterListBox.Item key="2">Red</FilterListBox.Item>
      </FilterListBox>
    ),
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'SearchComboBox',
    render: (props) => (
      <SearchComboBox label="Search" {...props}>
        <SearchComboBox.Item key="1">Blue</SearchComboBox.Item>
        <SearchComboBox.Item key="2">Red</SearchComboBox.Item>
      </SearchComboBox>
    ),
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'CommandMenu',
    render: (props) => (
      <CommandMenu {...props}>
        <CommandMenu.Item key="1" id="1">
          Create file
        </CommandMenu.Item>
      </CommandMenu>
    ),
    ignoreProps: ['children'],
  },
  {
    name: 'CommandTextArea',
    render: (props) => (
      <CommandTextArea label="Message" {...props}>
        <CommandTextArea.Item key="/clear" textValue="/clear">
          /clear
        </CommandTextArea.Item>
      </CommandTextArea>
    ),
    ignoreProps: ['label', 'children'],
  },
  {
    name: 'InlineInput',
    render: (props) => <InlineInput defaultValue="Hello" {...props} />,
    ignoreProps: ['defaultValue'],
  },
  {
    name: 'DatePicker',
    render: (props) => <DatePicker aria-label="Date" {...props} />,
  },
  {
    name: 'FileInput',
    render: (props) => <FileInput {...props} />,
  },
  {
    name: 'TextInputMapper',
    render: (props) => <TextInputMapper name="field" {...props} />,
    ignoreProps: ['name'],
  },
  {
    name: 'HueSlider',
    render: (props) => <HueSlider defaultValue={180} {...props} />,
    ignoreProps: ['defaultValue'],
  },
  {
    name: 'Tree',
    render: (props) => (
      <Tree
        treeData={[
          {
            key: 'fruits',
            title: 'Fruits',
            children: [{ key: 'a', title: 'Apple' }],
          },
        ]}
        defaultExpandedKeys={['fruits']}
        {...props}
      />
    ),
    ignoreProps: ['treeData', 'defaultExpandedKeys'],
  },
  {
    name: 'ItemCard',
    render: (props) => (
      <ItemCard title="Card" {...props}>
        Body
      </ItemCard>
    ),
    ignoreProps: ['title'],
    // ItemCard renders through `Item`, which reflects `aria-selected`.
    curatedSkips: { isSelected: ARIA_SELECTED_SKIP },
  },
  {
    name: 'Board',
    // jsdom measures 0, so an explicit width is required for widgets to lay out.
    render: (props) => (
      <Board
        width={1200}
        defaultLayout={[{ i: 'a', x: 0, y: 0, w: 2, h: 2 }]}
        {...props}
      >
        <Board.Widget id="a">Widget A</Board.Widget>
      </Board>
    ),
    ignoreProps: ['width', 'defaultLayout', 'children'],
  },
  {
    name: 'Form',
    render: (props) => (
      <Form {...props}>
        <Form.Item name="field" label="Field">
          <TextInput />
        </Form.Item>
      </Form>
    ),
    ignoreProps: ['children'],
  },
  {
    // Renders bare: `direction="right"` used to sit here, needed only because the
    // prop was mistyped as required, and it made the rule strip an explicit
    // `direction="right"` from consumers whose build then failed. See
    // `fixture-hygiene.test.tsx` for why hardcoding a documented default here
    // makes the probe unable to prove it — that guard now enforces this.
    name: 'ResizablePanel',
    render: (props) => <ResizablePanel {...props} />,
  },
  {
    name: 'GridProvider',
    render: (props) => (
      <GridProvider {...props}>
        <div>cell</div>
      </GridProvider>
    ),
    ignoreProps: ['children'],
  },
  {
    name: 'DisplayTransition',
    // `children` must be a function; `isShown` is required.
    render: (props) => (
      <DisplayTransition isShown {...props}>
        {({ ref }: any) => <div ref={ref}>content</div>}
      </DisplayTransition>
    ),
    ignoreProps: ['children', 'isShown'],
  },
  {
    name: 'Space',
    render: (props) => (
      <Space {...props}>
        <div>a</div>
        <div>b</div>
      </Space>
    ),
  },
  { name: 'Prefix', render: (props) => <Prefix {...props}>@</Prefix> },
  { name: 'Suffix', render: (props) => <Suffix {...props}>x</Suffix> },
  {
    name: 'LoadingAnimation',
    render: (props) => <LoadingAnimation {...props} />,
  },
  {
    name: 'CopyPasteBlock',
    render: (props) => <CopyPasteBlock value="some text" {...props} />,
    ignoreProps: ['value'],
  },
  {
    name: 'PrismCode',
    render: (props) => <PrismCode code="SELECT 1;" language="sql" {...props} />,
    ignoreProps: ['code', 'language'],
  },
  { name: 'Tooltip', render: (props) => <Tooltip {...props}>Tip</Tooltip> },
  { name: 'Portal', render: (props) => <Portal {...props}>content</Portal> },

  /* ── Triggers and overlays ────────────────────────────────────────────── */
  {
    name: 'DialogTrigger',
    // Throws unless it has exactly two children; `defaultOpen` makes the
    // portalled dialog render at all.
    render: (props) => (
      <DialogTrigger defaultOpen {...props}>
        <Button>Open</Button>
        <Dialog>Dialog content</Dialog>
      </DialogTrigger>
    ),
    ignoreProps: ['children', 'defaultOpen'],
  },
  {
    name: 'MenuTrigger',
    render: (props) => (
      <MenuTrigger defaultOpen {...props}>
        <Button aria-label="Open">Open</Button>
        <Menu>
          <Menu.Item key="copy">Copy</Menu.Item>
        </Menu>
      </MenuTrigger>
    ),
    ignoreProps: ['children', 'defaultOpen'],
  },
  {
    name: 'TooltipTrigger',
    render: (props) => (
      <TooltipTrigger defaultOpen {...props}>
        <Button>Hover</Button>
        <Tooltip>Tip</Tooltip>
      </TooltipTrigger>
    ),
    ignoreProps: ['children', 'defaultOpen'],
  },
  {
    name: 'TooltipProvider',
    render: (props) => (
      <TooltipProvider title="Tip" defaultOpen {...props}>
        <Button>Hover</Button>
      </TooltipProvider>
    ),
    ignoreProps: ['children', 'title', 'defaultOpen'],
  },
  {
    name: 'DialogContainer',
    render: (props) => (
      <DialogContainer isOpen onDismiss={() => {}} {...props}>
        <Dialog>Dialog content</Dialog>
      </DialogContainer>
    ),
    ignoreProps: ['children', 'isOpen', 'onDismiss'],
  },
  {
    name: 'AlertDialog',
    // Needs a Dialog host: it calls `useDialogContext()`.
    render: (props) => (
      <DialogTrigger defaultOpen isDismissable>
        <Button>Open</Button>
        {() => <AlertDialog title="Title" content="Body" {...props} />}
      </DialogTrigger>
    ),
    ignoreProps: ['title', 'content'],
  },
  {
    name: 'DialogForm',
    render: (props) => (
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <DialogForm title="Form" onSubmit={async () => {}} {...props}>
          <TextInput name="name" label="Name" />
        </DialogForm>
      </DialogTrigger>
    ),
    ignoreProps: ['children', 'title', 'onSubmit'],
  },
  {
    name: 'ButtonSplit',
    render: (props) => (
      <ButtonSplit
        defaultActionKey="deploy"
        actions={[{ key: 'deploy', label: 'Deploy' }]}
        {...props}
      />
    ),
    ignoreProps: ['actions', 'defaultActionKey'],
  },
  {
    name: 'Pagination',
    render: (props) => <Pagination total={200} pageSize={20} {...props} />,
    ignoreProps: ['total', 'pageSize'],
  },
  {
    name: 'DataTable',
    render: (props) => (
      <DataTable
        data={[{ id: '1', name: 'Alpha' }]}
        columns={[{ key: 'name', title: 'Name' }]}
        {...props}
      />
    ),
    conditions: [
      // Same shape as `ItemTable`: `sortMode` only resolves to `'client'` when
      // a column opts into sorting.
      {
        label: 'with a sortable column',
        props: { columns: [{ key: 'name', title: 'Name', isSortable: true }] },
      },
    ],
    ignoreProps: ['data', 'columns', 'isFiltered', 'sorts', 'defaultSorts'],
  },
  {
    name: 'ItemTable',
    render: (props) => (
      <ItemTable
        data={[{ id: '1', name: 'Alpha' }]}
        columns={[{ key: 'name', title: 'Name' }]}
        {...props}
      />
    ),
    conditions: [
      // `sortMode` defaults to `'client'` only when a column opts into sorting,
      // and to `'off'` otherwise. Probing both shapes lets the prover exclude
      // it if the verdict is not stable.
      {
        label: 'with a sortable column',
        props: { columns: [{ key: 'name', title: 'Name', isSortable: true }] },
      },
    ],
    // `isFiltered` has no literal default — it falls back to whatever the
    // built-in search reports, which settles through a debounce. Probing it
    // yields either verdict depending on timing, and `isFiltered={false}` is
    // not redundant anyway once a search is active.
    ignoreProps: ['data', 'columns', 'isFiltered'],
  },
];

export const FIXTURES_BY_NAME = new Map(FIXTURES.map((f) => [f.name, f]));
