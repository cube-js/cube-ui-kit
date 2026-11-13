import {
  AlertDialog,
  Checkbox,
  ColorPicker,
  ColorSwatch,
  ColorSwatchGroup,
  ComboBox,
  CommandMenu,
  DataTable,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateRangeSeparatedPicker,
  Dialog,
  DialogForm,
  FileInput,
  FilterListBox,
  FilterPicker,
  Form,
  GridLayout,
  GridProvider,
  HueSlider,
  ItemTable,
  Label,
  Layout,
  ListBox,
  MonthPicker,
  Picker,
  Placeholder,
  Prefix,
  QuarterPicker,
  Radio,
  RangeSlider,
  SearchComboBox,
  Select,
  Slider,
  Suffix,
  Switch,
  Tabs,
  TagInput,
  TimeInput,
  ToggleGroup,
  Tooltip,
  Tree,
  WeekPicker,
  YearPicker,
} from '../index';
import { renderWithRoot, screen } from '../test';

import { PeriodPicker } from './fields/DatePicker/PeriodPicker';

const customization = {
  qaVal: 'example',
  className: 'custom-control',
  style: { outline: '1px solid red' },
  tokens: { '$custom-token': '7px' },
  mods: { custom: true },
  element: 'CustomControl' as const,
  title: 'Native title override',
};

function expectCustomization(element: HTMLElement) {
  expect(element).toHaveAttribute('data-qaval', 'example');
  expect(element).toHaveClass('custom-control');
  expect(element).toHaveStyle({
    outline: '1px solid red',
    '--custom-token': '7px',
  });
  expect(element).toHaveAttribute('data-custom');
  expect(element).not.toHaveAttribute('data-element', 'CustomControl');
  expect(element).not.toHaveAttribute('title', 'Native title override');
  expect(element).not.toHaveAttribute('data-theme', 'unsupported-theme');
}

const dates = [
  ['DateInput', DateInput],
  ['DatePicker', DatePicker],
  ['DateRangePicker', DateRangePicker],
  ['DateRangeSeparatedPicker', DateRangeSeparatedPicker],
  ['MonthPicker', MonthPicker],
  ['QuarterPicker', QuarterPicker],
  ['TimeInput', TimeInput],
  ['WeekPicker', WeekPicker],
  ['YearPicker', YearPicker],
] as const;

function ModernForm() {
  const form = Form.useController();

  return <Form form={form} qa="custom" mods={{ custom: true }} />;
}

describe('component base props', () => {
  it.each(dates)(
    'puts the date props on %s with and without field chrome',
    (_, Control) => {
      for (const label of [undefined, 'Date']) {
        const { unmount } = renderWithRoot(
          <Control
            {...customization}
            qa="custom"
            label={label}
            aria-label={label ? undefined : 'Date'}
          />,
        );
        expectCustomization(screen.getByTestId('custom'));
        unmount();
      }
    },
  );

  it('puts the date props on PeriodPicker', () => {
    renderWithRoot(
      <PeriodPicker
        {...customization}
        picker="month"
        qa="custom"
        label="Period"
      />,
    );
    expectCustomization(screen.getByTestId('custom'));
  });

  it.each([
    ['ComboBox', ComboBox],
    ['FilterListBox', FilterListBox],
    ['ListBox', ListBox],
    ['SearchComboBox', SearchComboBox],
    ['Select', Select],
  ] as const)('puts the collection props on the %s control', (_, Control) => {
    for (const label of [undefined, 'Fruit']) {
      const { unmount } = renderWithRoot(
        <Control
          {...customization}
          qa="custom"
          label={label}
          aria-label={label ? undefined : 'Fruit'}
        >
          <Control.Item key="pear">Pear</Control.Item>
        </Control>,
      );
      expectCustomization(screen.getByTestId('custom'));
      unmount();
    }
  });

  it('forwards ListBox props in the reorderable path', () => {
    renderWithRoot(
      <ListBox
        {...customization}
        qa="custom"
        label="Fruit"
        isReorderable
        onReorder={() => {}}
      >
        <ListBox.Item key="pear">Pear</ListBox.Item>
      </ListBox>,
    );
    expectCustomization(screen.getByRole('listbox'));
  });

  it.each([
    ['Switch', <Switch {...customization} qa="custom" label="Switch" />],
    ['FileInput', <FileInput {...customization} qa="custom" label="File" />],
    [
      'ColorPicker',
      <ColorPicker
        {...customization}
        theme="special"
        qa="custom"
        label="Color"
      />,
    ],
    [
      'ColorSwatch',
      <ColorSwatch {...customization} qa="custom" color="#abc" />,
    ],
    ['Slider', <Slider {...customization} qa="custom" label="Value" />],
    [
      'RangeSlider',
      <RangeSlider {...customization} qa="custom" label="Range" />,
    ],
    ['HueSlider', <HueSlider {...customization} qa="custom" label="Hue" />],
    [
      'Tree',
      <Tree {...customization} qa="custom" treeData={[]} ariaLabel="Tree" />,
    ],
    [
      'Tabs',
      <Tabs {...customization} qa="custom" aria-label="Tabs">
        <Tabs.Tab key="one" title="One" />
      </Tabs>,
    ],
    [
      'Dialog',
      <Dialog {...customization} qa="custom" aria-label="Dialog">
        Content
      </Dialog>,
    ],
    [
      'AlertDialog',
      <AlertDialog
        {...customization}
        qa="custom"
        title="Alert"
        content="Content"
      />,
    ],
    [
      'DialogForm',
      <DialogForm {...customization} qa="custom" title="Form">
        Content
      </DialogForm>,
      'customDialog',
    ],
    [
      'Tooltip',
      <Tooltip {...customization} qa="custom">
        Tooltip text
      </Tooltip>,
    ],
    [
      'ItemTable',
      <ItemTable
        {...customization}
        qa="custom"
        ariaLabel="Items"
        data={[]}
        columns={[{ key: 'value', title: 'Value' }]}
      />,
    ],
    [
      'DataTable',
      <DataTable
        {...customization}
        qa="custom"
        ariaLabel="Data"
        data={[]}
        columns={[{ key: 'value', title: 'Value' }]}
      />,
    ],
    [
      'ItemTable loading',
      <ItemTable
        {...customization}
        qa="custom"
        isLoading
        data={[]}
        columns={[]}
      />,
    ],
    [
      'DataTable loading',
      <DataTable
        {...customization}
        qa="custom"
        isLoading
        data={[]}
        columns={[]}
      />,
    ],
  ] as const)('forwards props on %s', (_, component, qa?: string) => {
    renderWithRoot(component);
    expectCustomization(screen.getByTestId(qa ?? 'custom'));
  });

  it('retains semantic trigger themes and content titles', () => {
    renderWithRoot(
      <>
        <ColorPicker qa="color" label="Color" theme="special" />
        <Select qa="select" label="Fruit" theme="special">
          <Select.Item key="pear">Pear</Select.Item>
        </Select>
        <Tabs aria-label="Tabs">
          <Tabs.Tab key="one" title="Tab title" />
        </Tabs>
        <Layout>
          <Layout.Header title="Page title" />
        </Layout>
      </>,
    );

    expect(screen.getByTestId('color')).toHaveAttribute(
      'data-theme',
      'special',
    );
    expect(screen.getByTestId('select')).toHaveAttribute(
      'data-theme',
      'special',
    );
    expect(screen.getByRole('tab', { name: 'Tab title' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Page title' }),
    ).toBeInTheDocument();
  });

  it('keeps picker themes on their triggers and slot names on their wrappers', () => {
    renderWithRoot(
      <>
        <Picker {...customization} qa="picker" label="Fruit" theme="special">
          <Picker.Item key="pear">Pear</Picker.Item>
        </Picker>
        <FilterPicker
          {...customization}
          qa="filter-picker"
          label="Filtered fruit"
          theme="special"
        >
          <FilterPicker.Item key="pear">Pear</FilterPicker.Item>
        </FilterPicker>
      </>,
    );

    for (const label of ['Fruit', 'Filtered fruit']) {
      const trigger = screen.getByRole('button', { name: label });
      expect(trigger).toHaveAttribute('data-theme', 'special');
      const wrapper = trigger.closest<HTMLElement>('.custom-control');

      expect(wrapper).toHaveAttribute('data-qaval', 'example');
      expect(wrapper).toHaveStyle({ '--custom-token': '7px' });
      expect(wrapper).not.toHaveAttribute('data-element', 'CustomControl');
      expect(wrapper).not.toHaveAttribute('title');
      expect(trigger).toHaveAttribute('data-custom');
    }
  });

  it('keeps group and toggle button customization on their controls', () => {
    const props = { ...customization, theme: 'unsupported-theme' };
    renderWithRoot(
      <>
        <Radio.Group {...props} qa="radio-group" label="Radio">
          <Radio value="one">One</Radio>
        </Radio.Group>
        <Checkbox.Group {...props} qa="checkbox-group" label="Checkbox">
          <Checkbox value="one">One</Checkbox>
        </Checkbox.Group>
        <ColorSwatchGroup
          {...props}
          qa="swatch-group"
          label="Swatch"
          colors={['#abc']}
        />
        <ToggleGroup
          {...props}
          qa="toggle-group"
          label="Toggle"
          defaultSelectedKey="one"
        >
          <ToggleGroup.Item
            {...props}
            qa="toggle-item"
            key="one"
            mods={{ custom: true, selected: false, theme: 'danger' }}
          >
            One
          </ToggleGroup.Item>
        </ToggleGroup>
      </>,
    );

    for (const qa of [
      'radio-group',
      'checkbox-group',
      'swatch-group',
      'toggle-group',
      'toggle-item',
    ]) {
      expectCustomization(screen.getByTestId(qa));
    }
    const toggle = screen.getByTestId('toggle-item');
    expect(toggle).toHaveAttribute('data-theme', 'default');
    expect(toggle).toHaveAttribute('data-selected');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('omits generic theme from roots with no appearance variant', () => {
    const props = { theme: 'unsupported-theme' };
    renderWithRoot(
      <>
        <Form {...props} qa="form" />
        <Layout {...props} qa="layout">
          <Layout.Header {...props} qa="header" title="Heading" />
        </Layout>
        <Tooltip {...props} qa="tooltip">
          Help
        </Tooltip>
      </>,
    );

    for (const qa of ['form', 'layout', 'header', 'tooltip']) {
      expect(screen.getByTestId(qa)).not.toHaveAttribute('data-theme');
    }
  });

  it.each([undefined, 'button', 'tabs'] as const)(
    'forwards props to the native radio in %s mode',
    (type) => {
      renderWithRoot(
        <Radio.Group type={type} label="Fruit">
          <Radio {...customization} qa="custom" value="pear">
            Pear
          </Radio>
        </Radio.Group>,
      );
      expectCustomization(screen.getByTestId('custom'));
    },
  );

  it.each([
    ['Checkbox', <Checkbox {...customization} qa="custom" label="Checkbox" />],
    ['TagInput', <TagInput {...customization} qa="custom" label="Tags" />],
  ] as const)('keeps the existing %s customization root', (_, component) => {
    renderWithRoot(component);
    const control = screen.getByTestId('custom');
    const box = control.closest<HTMLElement>('[data-qaval="example"]');

    expect(box).toBeInstanceOf(HTMLElement);
    expectCustomization(box!);
  });

  it.each([
    [
      'Placeholder',
      <Placeholder qa="custom" mods={{ custom: true, animated: false }} />,
    ],
    ['Form', <Form qa="custom" mods={{ custom: true }} />],
    ['modern Form', <ModernForm />],
    [
      'Label',
      <Label qa="custom" mods={{ custom: true }}>
        Label
      </Label>,
    ],
    [
      'CommandMenu',
      <CommandMenu qa="custom" mods={{ custom: true }}>
        <CommandMenu.Item key="one">One</CommandMenu.Item>
      </CommandMenu>,
    ],
    [
      'Tab',
      <Tabs aria-label="Tabs">
        <Tabs.Tab key="one" qa="custom" title="One" mods={{ custom: true }} />
      </Tabs>,
    ],
  ] as const)('merges caller modifiers on %s', (_, component) => {
    renderWithRoot(component);
    expect(screen.getByTestId('custom')).toHaveAttribute('data-custom');
  });

  it.each([
    [
      'Prefix',
      <Prefix qa="custom" outerGap="2x" tokens={customization.tokens}>
        Prefix
      </Prefix>,
      '--prefix-gap',
    ],
    [
      'Suffix',
      <Suffix qa="custom" outerGap="2x" tokens={customization.tokens}>
        Suffix
      </Suffix>,
      '--suffix-gap',
    ],
    [
      'GridProvider',
      <GridProvider
        {...{ 'data-qa': 'custom' }}
        width="40x"
        tokens={customization.tokens}
      >
        Grid
      </GridProvider>,
      '--grid-width',
    ],
  ] as const)('merges caller tokens on %s', (_, component, internalToken) => {
    renderWithRoot(component);
    const control = screen.getByTestId('custom');

    expect(control).toHaveStyle({ '--custom-token': '7px' });
    expect(control.style.getPropertyValue(internalToken)).toBeTruthy();
  });

  it('merges customization on Layout and its compound components', () => {
    renderWithRoot(
      <Layout {...customization} qa="layout">
        <Layout.Header {...customization} qa="header" title="Header" />
        <Layout.Toolbar {...customization} qa="toolbar">
          Toolbar
        </Layout.Toolbar>
        <Layout.Panel {...customization} qa="panel" side="left">
          Panel
        </Layout.Panel>
        <Layout.Pane {...customization} qa="pane">
          Pane
        </Layout.Pane>
        <Layout.Content {...customization} qa="content">
          Content
        </Layout.Content>
        <Layout.Block {...customization} qa="block">
          Block
        </Layout.Block>
        <Layout.Flex {...customization} qa="flex">
          Flex
        </Layout.Flex>
        <Layout.Grid {...customization} qa="grid">
          Grid
        </Layout.Grid>
        <Layout.Footer {...customization} qa="footer">
          Footer
        </Layout.Footer>
      </Layout>,
    );
    for (const qa of [
      'layout',
      'header',
      'toolbar',
      'panel',
      'pane',
      'content',
      'block',
      'flex',
      'grid',
      'footer',
    ]) {
      expectCustomization(screen.getByTestId(qa));
    }
  });

  it('forwards panel props in dialog mode', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel
          {...customization}
          qa="custom"
          side="left"
          mode="dialog"
          isDialogOpen
        >
          Panel
        </Layout.Panel>
      </Layout>,
    );
    expectCustomization(screen.getByTestId('custom'));
  });

  it('merges customization on GridLayout', () => {
    renderWithRoot(
      <GridLayout {...customization} qa="custom">
        Grid
      </GridLayout>,
    );
    expectCustomization(screen.getByTestId('custom'));
  });
});
