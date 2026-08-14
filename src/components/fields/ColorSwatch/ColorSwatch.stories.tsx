import { StoryFn } from '@storybook/react-vite';

import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button';
import { ItemButton } from '../../actions/ItemButton';
import { Item } from '../../content/Item';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';

import { ColorSwatch, CubeColorSwatchProps } from './ColorSwatch';

export default {
  title: 'Forms/ColorSwatch',
  component: ColorSwatch,
  parameters: { controls: { exclude: baseProps } },
  args: { color: '#7a4dbf' },
  argTypes: {
    /* Content */
    color: {
      control: { type: 'color' },
      description:
        'The color to show. Anything the color inputs accept; `null` shows the empty state',
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description:
        'The edge of the swatch: 20px, 24px or 28px. Unset, it tracks the control around it',
      table: { defaultValue: { summary: 'medium' } },
    },
  },
};

const Template: StoryFn<CubeColorSwatchProps> = (args) => (
  <ColorSwatch {...args} />
);

export const Default = Template.bind({});

export const Empty = Template.bind({});
Empty.args = { color: null };

export const Sizes: StoryFn<CubeColorSwatchProps> = (args) => (
  <Space placeItems="center start">
    <ColorSwatch {...args} size="small" />
    <ColorSwatch {...args} size="medium" />
    <ColorSwatch {...args} size="large" />
  </Space>
);
Sizes.parameters = {
  docs: {
    description: { story: '20px, 24px and 28px.' },
  },
};

/**
 * The point of the auto size: one swatch markup, four control heights, no
 * numbers passed between them.
 */
export const InsideControls: StoryFn<CubeColorSwatchProps> = (args) => (
  <Flow gap="2x" placeItems="start">
    <Space placeItems="center start">
      {(['small', 'medium', 'large'] as const).map((size) => (
        <Button key={size} size={size} icon={<ColorSwatch {...args} />}>
          {size}
        </Button>
      ))}
    </Space>
    <Space placeItems="center start">
      {(['small', 'medium', 'large'] as const).map((size) => (
        <ItemButton
          key={size}
          size={size}
          type="outline"
          rightIcon={<ColorSwatch {...args} />}
        >
          {size}
        </ItemButton>
      ))}
    </Space>
    <Item
      icon={<ColorSwatch {...args} />}
      suffix={<ColorSwatch color="#26fcb2" />}
    >
      Brand color
    </Item>
  </Flow>
);
InsideControls.parameters = {
  docs: {
    description: {
      story:
        'Left unset, the swatch reads the height of the `Item` or `Button` around it and sits `8px` inside it — 20px in a small control, 24px in a medium one, 32px in a large one.',
    },
  },
};

export const Colors: StoryFn<CubeColorSwatchProps> = () => (
  <Space placeItems="center start">
    {[
      '#7a4dbf',
      '#26fcb2',
      '#ff8800',
      '#0044cc',
      'oklch(0.7 0.15 30)',
      null,
    ].map((color, index) => (
      <ColorSwatch key={index} color={color} />
    ))}
  </Space>
);
Colors.parameters = {
  docs: {
    description: {
      story:
        'Any notation the color fields accept. An unparsable color falls back to the empty state rather than guessing.',
    },
  },
};
