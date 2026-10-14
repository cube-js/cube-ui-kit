import {
  CollectionItem,
  ComboBox,
  CommandMenu,
  FilterListBox,
  FilterPicker,
  ListBox,
  Menu,
  Picker,
  SearchComboBox,
  Select,
} from '@cube-dev/ui-kit';

export const comboBoxHref = (
  // @ts-expect-error Selection options cannot become links.
  <ComboBox.Item href="/workbooks">Workbooks</ComboBox.Item>
);
export const comboBoxTo = (
  // @ts-expect-error The metadata index cannot allow `to` on selection options.
  <ComboBox.Item to="/workbooks">Workbooks</ComboBox.Item>
);
export const searchComboBoxHref = (
  // @ts-expect-error Selection options cannot become links.
  <SearchComboBox.Item href="/workbooks">Workbooks</SearchComboBox.Item>
);
export const selectHref = (
  // @ts-expect-error Selection options cannot become links.
  <Select.Item href="/workbooks">Workbooks</Select.Item>
);
export const listBoxHref = (
  // @ts-expect-error Selection options cannot become links.
  <ListBox.Item href="/workbooks">Workbooks</ListBox.Item>
);
export const pickerHref = (
  // @ts-expect-error Selection options cannot become links.
  <Picker.Item href="/workbooks">Workbooks</Picker.Item>
);
export const filterPickerHref = (
  // @ts-expect-error Selection options cannot become links.
  <FilterPicker.Item href="/workbooks">Workbooks</FilterPicker.Item>
);
export const filterListBoxHref = (
  // @ts-expect-error Selection options cannot become links.
  <FilterListBox.Item href="/workbooks">Workbooks</FilterListBox.Item>
);
export const collectionItemHref = (
  // @ts-expect-error The generic collection item is a value-selection option.
  <CollectionItem href="/workbooks">Workbooks</CollectionItem>
);

export const menuHref = <Menu.Item href="/workbooks">Workbooks</Menu.Item>;
export const menuTo = (
  <Menu.Item to="/workbooks" navigationOptions={{ replace: true }}>
    Workbooks
  </Menu.Item>
);
export const commandMenuHref = (
  <CommandMenu.Item href="/workbooks" target="_blank" rel="noopener">
    Workbooks
  </CommandMenu.Item>
);
export const commandMenuTo = (
  <CommandMenu.Item
    to={{ pathname: '/workbooks', search: '?view=table' }}
    navigationOptions={{ replace: true, state: { source: 'palette' } }}
    onAction={() => {}}
  >
    Workbooks
  </CommandMenu.Item>
);
export const metadata = (
  <ComboBox.Item customMetadata="workbooks">Workbooks</ComboBox.Item>
);
