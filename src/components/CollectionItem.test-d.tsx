import { CommandMenu } from './actions/CommandMenu/CommandMenu';
import { Menu } from './actions/Menu/Menu';
import { CollectionItem } from './CollectionItem';
import { ComboBox } from './fields/ComboBox/ComboBox';
import { FilterListBox } from './fields/FilterListBox/FilterListBox';
import { FilterPicker } from './fields/FilterPicker/FilterPicker';
import { ListBox } from './fields/ListBox/ListBox';
import { Picker } from './fields/Picker/Picker';
import { SearchComboBox } from './fields/SearchComboBox/SearchComboBox';
import { Select } from './fields/Select/Select';

export const comboBoxHref = (
  // @ts-expect-error Value-selection options do not accept destinations.
  <ComboBox.Item href="/workbooks">Workbooks</ComboBox.Item>
);
export const comboBoxTo = (
  // @ts-expect-error The arbitrary metadata index must not allow `to`.
  <ComboBox.Item to="/workbooks">Workbooks</ComboBox.Item>
);
export const searchComboBoxHref = (
  // @ts-expect-error Search results select a value rather than navigate.
  <SearchComboBox.Item href="/workbooks">Workbooks</SearchComboBox.Item>
);
export const selectHref = (
  // @ts-expect-error Select options select a value rather than navigate.
  <Select.Item href="/workbooks">Workbooks</Select.Item>
);
export const listBoxHref = (
  // @ts-expect-error ListBox options select a value rather than navigate.
  <ListBox.Item href="/workbooks">Workbooks</ListBox.Item>
);
export const pickerHref = (
  // @ts-expect-error Picker options select a value rather than navigate.
  <Picker.Item href="/workbooks">Workbooks</Picker.Item>
);
export const filterPickerHref = (
  // @ts-expect-error FilterPicker options select a value rather than navigate.
  <FilterPicker.Item href="/workbooks">Workbooks</FilterPicker.Item>
);
export const filterListBoxHref = (
  // @ts-expect-error FilterListBox options select a value rather than navigate.
  <FilterListBox.Item href="/workbooks">Workbooks</FilterListBox.Item>
);
export const collectionItemHref = (
  // @ts-expect-error The generic collection item is a value-selection option.
  <CollectionItem href="/workbooks">Workbooks</CollectionItem>
);
export const collectionItemNavigationOptions = (
  // @ts-expect-error Router options belong to navigation items.
  <CollectionItem navigationOptions={{ replace: true }}>
    Workbooks
  </CollectionItem>
);

export const menuHref = <Menu.Item href="/workbooks">Workbooks</Menu.Item>;
export const menuTo = (
  <Menu.Item
    to={{ pathname: '/workbooks' }}
    navigationOptions={{ replace: true }}
  >
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
