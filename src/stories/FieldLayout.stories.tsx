import { Block } from '../components/Block';
import { ListBox } from '../components/fields/ListBox/ListBox';
import { TextArea } from '../components/fields/TextArea/TextArea';
import { TextInput } from '../components/fields/TextInput/TextInput';
import { Flex } from '../components/layout/Flex';
import { Space } from '../components/layout/Space';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = {
  title: 'Getting Started/Field Layout',
};

export default meta;
type Story = StoryObj;

// The dashed frame hugs the box the style props size.
const FRAME_STYLES = { outline: '1bw dashed #dark-04', width: 'max-content' };
// Taller than its inputs, so the text area shows that it fills the height too.
const ROW_FRAME_STYLES = {
  outline: '1bw dashed #dark-04',
  width: 'max 60x',
  height: '20x',
};

/**
 * An input's style props size its outer element: the input when it is bare,
 * the whole field when it has a label. A sized field lets its input fill it;
 * `controlWidth` sizes the input alone, beside a label of any length. In a
 * stretched row the text area fills the row's height, and single-line inputs
 * keep theirs at the top.
 */
export const FieldLayout: Story = {
  render: () => (
    <Space flow="column" gap="3x" width="max 60x">
      <Block styles={FRAME_STYLES}>
        <TextInput aria-label="Bare" placeholder="Bare" width="40x" />
      </Block>
      <Block styles={FRAME_STYLES}>
        <TextInput label="Top label" width="40x" />
      </Block>
      <Block styles={FRAME_STYLES}>
        <TextInput label="Side label" labelPosition="side" width="40x" />
      </Block>
      <Block styles={FRAME_STYLES}>
        <TextInput label="Split label" labelPosition="split" width="40x" />
      </Block>
      <Block styles={FRAME_STYLES}>
        <TextInput
          label="Field 40x, input 20x"
          width="40x"
          controlWidth="20x"
        />
      </Block>
      <Block styles={FRAME_STYLES}>
        <TextInput label="Limit" labelPosition="side" controlWidth="20x" />
      </Block>
      <Block styles={FRAME_STYLES}>
        <TextInput
          label="A longer label"
          labelPosition="side"
          controlWidth="20x"
        />
      </Block>
      <Flex gap="2x" styles={ROW_FRAME_STYLES}>
        {/* Short labels, so none wraps at 390px and the inputs stay level. */}
        <TextInput label="Grows" flexGrow={1} />
        <TextInput
          label="Invalid"
          flexGrow={1}
          isInvalid
          errorMessage="Required"
        />
        <TextArea label="Text area" flexGrow={1} />
      </Flex>
      <Block styles={FRAME_STYLES}>
        <ListBox label="Fills its 30x field" height="30x">
          {Array.from({ length: 12 }, (_, index) => (
            <ListBox.Item key={index}>{`Option ${index + 1}`}</ListBox.Item>
          ))}
        </ListBox>
      </Block>
    </Space>
  ),
};
