import { StoryFn } from '@storybook/react-vite';
import {
  IconCaretDown,
  IconCoin,
  IconHeart,
  IconHeartFilled,
} from '@tabler/icons-react';
import { useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { Button, CubeButtonProps } from './Button';

export default {
  title: 'Actions/Button',
  component: Button,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Visual presentation */
    type: {
      options: ['primary', 'secondary', 'outline', 'neutral', 'clear', 'link'],
      control: { type: 'radio' },
      description: 'Visual style variant of the button',
      table: {
        defaultValue: { summary: 'outline' },
      },
    },
    theme: {
      options: ['default', 'danger', 'success', 'warning', 'note', 'special'],
      control: { type: 'radio' },
      description: 'Semantic colour palette theme',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
      control: { type: 'radio' },
      description: 'Button size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },

    /* Content */
    icon: {
      control: { type: null },
      description:
        'Icon rendered before the content. Can be: ReactNode, `true` (empty slot), or function `({ loading, selected, ...mods }) => ReactNode | true`',
    },
    rightIcon: {
      control: { type: null },
      description:
        'Icon rendered after the content. Can be: ReactNode, `true` (empty slot), or function `({ loading, selected, ...mods }) => ReactNode | true`',
    },
    children: {
      control: { type: 'text' },
      description: 'Button label or custom content',
    },

    /* State */
    isLoading: {
      control: { type: 'boolean' },
      description:
        'Show loading spinner and disable interactions (default: false)',
      table: {
        defaultValue: { summary: false },
      },
    },
    isSelected: {
      control: { type: 'boolean' },
      description:
        'Marks the button as pressed / selected (toggle) (default: false)',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Navigation */
    to: {
      control: { type: 'text' },
      description:
        'Destination URL or route; prefix with `!` to open in new tab, `@` to bypass router',
    },

    /* Events */
    onPress: {
      action: 'press',
      description:
        'Callback fired when the button is activated by mouse, touch, or keyboard',
      control: { type: null },
    },
  },
};

const Template: StoryFn<CubeButtonProps> = ({
  icon,
  rightIcon,
  children,
  ...props
}) => (
  <Space
    radius="1x"
    padding={props.theme === 'special' ? '2x' : undefined}
    fill={props.theme === 'special' ? '#dark' : undefined}
  >
    <Button
      icon={icon}
      rightIcon={rightIcon}
      {...props}
      onPress={(e) => console.log('Press', e)}
    >
      {children}
    </Button>
  </Space>
);

const TemplateSizes: StoryFn<CubeButtonProps> = ({
  children,
  icon,
  rightIcon,
  ...props
}) => (
  <Space>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="xsmall">
      XSmall
    </Button>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="small">
      Small
    </Button>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="medium">
      Medium
    </Button>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="large">
      Large
    </Button>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="xlarge">
      XLarge
    </Button>
  </Space>
);

const TemplateSizesOnlyIcon: StoryFn<CubeButtonProps> = ({
  children,
  icon,
  rightIcon,
  ...props
}) => (
  <Space>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="xsmall" />
    <Button icon={icon} rightIcon={rightIcon} {...props} size="small" />
    <Button icon={icon} rightIcon={rightIcon} {...props} size="medium" />
    <Button icon={icon} rightIcon={rightIcon} {...props} size="large" />
    <Button icon={icon} rightIcon={rightIcon} {...props} size="xlarge" />
  </Space>
);

const BUTTON_TYPES = [
  'primary',
  'secondary',
  'outline',
  'neutral',
  'clear',
  'link',
] as const;

const SELECTED_TYPES: string[] = ['outline', 'neutral', 'clear'];

const TypeStatesRow = ({
  type,
  theme,
}: {
  type: CubeButtonProps['type'];
  theme?: CubeButtonProps['theme'];
}) => (
  <Space flow="column">
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        opacity: 0.6,
        color: theme === 'special' ? '#fff' : undefined,
      }}
    >
      {type}
    </span>
    <Space>
      <Button
        type={type}
        theme={theme}
        mods={{
          hovered: false,
          pressed: false,
          focused: false,
          disabled: false,
        }}
      >
        Default
      </Button>
      <Button
        type={type}
        theme={theme}
        mods={{
          hovered: true,
          pressed: false,
          focused: false,
          disabled: false,
        }}
      >
        Hovered
      </Button>
      <Button
        type={type}
        theme={theme}
        mods={{
          hovered: false,
          pressed: true,
          focused: false,
          disabled: false,
        }}
      >
        Pressed
      </Button>
      <Button
        type={type}
        theme={theme}
        mods={{ hovered: true, pressed: true, focused: false, disabled: false }}
      >
        Pressed & Hovered
      </Button>
      <Button
        type={type}
        theme={theme}
        mods={{
          hovered: false,
          pressed: false,
          focused: true,
          disabled: false,
        }}
      >
        Focused
      </Button>
      <Button
        isDisabled
        type={type}
        theme={theme}
        mods={{ hovered: false, pressed: false, focused: false }}
      >
        Disabled
      </Button>
      {SELECTED_TYPES.includes(type!) ? (
        <Button
          type={type}
          theme={theme}
          mods={{
            pressed: false,
            focused: false,
            disabled: false,
            selected: true,
          }}
        >
          Selected
        </Button>
      ) : null}
    </Space>
  </Space>
);

const ThemeStatesTemplate: StoryFn<CubeButtonProps> = ({ theme }) => {
  const isSpecial = theme === 'special';

  return (
    <Space
      flow="column"
      gap="3x"
      padding={isSpecial ? '2x' : undefined}
      fill={isSpecial ? '#dark' : undefined}
      radius="1x"
    >
      {BUTTON_TYPES.map((type) => (
        <TypeStatesRow key={type} type={type} theme={theme} />
      ))}
    </Space>
  );
};

export const Default = Template.bind({});
Default.args = {
  children: 'Button',
};

export const DefaultStates = ThemeStatesTemplate.bind({});
DefaultStates.args = {};

export const DangerStates = ThemeStatesTemplate.bind({});
DangerStates.args = {
  theme: 'danger',
};

export const SuccessStates = ThemeStatesTemplate.bind({});
SuccessStates.args = {
  theme: 'success',
};

export const WarningStates = ThemeStatesTemplate.bind({});
WarningStates.args = {
  theme: 'warning',
};

export const NoteStates = ThemeStatesTemplate.bind({});
NoteStates.args = {
  theme: 'note',
};

export const SpecialStates = ThemeStatesTemplate.bind({});
SpecialStates.args = {
  theme: 'special',
};

export const Small = Template.bind({});
Small.args = {
  children: 'Button',
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  children: 'Button',
  size: 'large',
};

export const LeftIconAndText = TemplateSizes.bind({});
LeftIconAndText.args = {
  children: 'Button',
  icon: <IconCoin />,
};

export const RightIconAndText = TemplateSizes.bind({});
RightIconAndText.args = {
  children: 'Button',
  rightIcon: <IconCaretDown />,
};

export const TwoIconsAndText = TemplateSizes.bind({});
TwoIconsAndText.args = {
  children: 'Button',
  icon: <IconCoin />,
  rightIcon: <IconCaretDown />,
};

export const OnlyIcon = TemplateSizesOnlyIcon.bind({});
OnlyIcon.args = {
  icon: <IconCoin />,
};

export const Loading = TemplateSizes.bind({});
Loading.args = {
  icon: <IconCoin />,
  isLoading: true,
  children: 'Button',
};

export const DynamicIcon = () => {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <Button
      type="clear"
      isSelected={isSelected}
      icon={({ selected }) => (selected ? <IconHeartFilled /> : <IconHeart />)}
      onPress={() => setIsSelected((prev) => !prev)}
    >
      {isSelected ? 'Liked' : 'Like'}
    </Button>
  );
};

export const ToggleLoading = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Space>
      <Button isLoading={isLoading}>Target Button</Button>
      <Button type="outline" onPress={() => setIsLoading((prev) => !prev)}>
        {isLoading ? 'Stop Loading' : 'Start Loading'}
      </Button>
    </Space>
  );
};

export const CustomSize: StoryFn<CubeButtonProps> = () => (
  <Space gap="2x" flow="column" placeItems="start">
    <Button size="8x" icon={<IconCoin />}>
      Custom size with 8x
    </Button>
    <Button size={64} icon={<IconCoin />}>
      Custom size with 64px
    </Button>
  </Space>
);

CustomSize.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates custom size values using the `size` prop. Supports both string values (like `8x`) and number values (converted to pixels, like `64`). Custom sizes override the default size token via the `tokens` prop.',
    },
  },
};
