import { ListBox, Select, TextInput } from '@cube-dev/ui-kit';

import type { FieldLayoutStyleProps } from '@cube-dev/ui-kit';

/**
 * An input's style props are exactly its field layout props, which place and
 * size its outer element. Appearance goes through `styles`.
 */
export function FieldLayoutStyleExamples() {
  const layout: FieldLayoutStyleProps = { width: '40x', flexGrow: 1 };

  return (
    <>
      <TextInput label="Name" {...layout} />
      <TextInput label="Name" width="40x" styles={{ width: '20x' }} />
      <ListBox label="Options" height="30x" gridArea="list">
        <ListBox.Item key="a">Alpha</ListBox.Item>
      </ListBox>

      {/* @ts-expect-error appearance is not a field style prop */}
      <TextInput label="Name" fill="#white" />
      {/* @ts-expect-error appearance is not a field style prop */}
      <Select label="Letter" padding="1x">
        <Select.Item key="a">Alpha</Select.Item>
      </Select>
      <TextInput label="Name" styles={{ fill: '#white', padding: '1x' }} />
    </>
  );
}
