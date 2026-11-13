import {
  ColorInput,
  ColorPicker,
  Layout,
  Picker,
  Radio,
  Select,
  Tabs,
  TextInput,
  ToggleGroup,
} from '@cube-dev/ui-kit';

const radioGroup = (
  <Radio.ButtonGroup
    qaVal="display"
    // oxlint-disable-next-line tasty/no-classname-prop -- verifies the third-party integration contract
    className="integration"
    // oxlint-disable-next-line tasty/no-style-prop -- verifies the third-party integration contract
    style={{ outline: 'none' }}
  />
);
const toggleItem = (
  <ToggleGroup.Item
    id="bold"
    qaVal="bold"
    // oxlint-disable-next-line tasty/no-classname-prop -- verifies the third-party integration contract
    className="integration"
    // oxlint-disable-next-line tasty/no-style-prop -- verifies the third-party integration contract
    style={{ outline: 'none' }}
    tokens={{ '$integration-size': '1x' }}
    mods={{ integration: true }}
  />
);
const select = (
  <Select theme="special">
    <Select.Item key="pear">Pear</Select.Item>
  </Select>
);
const colorPicker = <ColorPicker theme="special" />;
const header = <Layout.Header title="Heading" />;
const tab = <Tabs.Tab title="Tab" />;

// @ts-expect-error The field owns its Tasty element name.
const renamedField = <TextInput element="Control" />;
// @ts-expect-error ColorInput owns the same slot as the other text inputs.
const renamedColorInput = <ColorInput element="Control" />;
// @ts-expect-error Use the field's label, description or tooltip API.
const nativeTitle = <TextInput title="Hint" />;
// @ts-expect-error Group appearance comes from its own variant and state.
const themedGroup = <Radio.ButtonGroup theme="special" />;
// @ts-expect-error The toggle group owns its slot name.
const renamedGroup = <ToggleGroup element="Control" />;
// @ts-expect-error The button's theme comes from its group state.
const themedToggle = <ToggleGroup.Item id="bold" theme="special" />;
// @ts-expect-error Tab's title is content, but its element name is internal.
const renamedTab = <Tabs.Tab title="Tab" element="Control" />;

const renamedPicker = (
  // @ts-expect-error Picker owns its slot name while its trigger supports theme.
  <Picker element="Control" theme="special">
    <Picker.Item key="one">One</Picker.Item>
  </Picker>
);
const themedPanelHeader = (
  // @ts-expect-error The panel header has a content title and a fixed appearance.
  <Layout.PanelHeader title="Heading" theme="special" />
);

void [
  radioGroup,
  toggleItem,
  select,
  colorPicker,
  header,
  tab,
  renamedField,
  renamedColorInput,
  nativeTitle,
  themedGroup,
  renamedGroup,
  themedToggle,
  renamedTab,
  renamedPicker,
  themedPanelHeader,
];
