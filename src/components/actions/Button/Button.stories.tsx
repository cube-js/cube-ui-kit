import { StoryFn } from '@storybook/react-vite';
import {
  IconCaretDown,
  IconCoin,
  IconHeart,
  IconHeartFilled,
} from '@tabler/icons-react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { Title } from '../../content/Title';
import { Space } from '../../layout/Space';

import { Button, CubeButtonProps } from './Button';

export default {
  title: 'Actions/Button',
  component: Button,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Visual presentation */
    type: {
      options: ['primary', 'outline', 'outline-2', 'clear', 'link'],
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

    /* Tooltip */
    tooltip: {
      control: { type: 'text' },
      description:
        'Tooltip content. Use a string for simple text, `true` for auto tooltip on overflow, or an object with `{ title, auto, placement, ...tooltipProps }`',
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
  'outline',
  'outline-2',
  'clear',
  'link',
] as const;

const SELECTED_TYPES: string[] = ['outline', 'outline-2', 'clear'];

// Types whose base fill is `#surface-3` and are therefore designed to sit
// on a `#surface-2` container (so they remain visible against the
// surrounding ladder).
const SURFACE_2_TYPES: string[] = ['outline-2'];

const BASE_MODS = {
  hovered: false,
  pressed: false,
  focused: false,
  disabled: false,
  selected: false,
};

const TypeStatesRow = ({
  type,
  theme,
}: {
  type: CubeButtonProps['type'];
  theme?: CubeButtonProps['theme'];
}) => {
  const hasSelected = SELECTED_TYPES.includes(type!);
  const titleColor = theme === 'special' ? '#white' : undefined;
  return (
    <Space flow="column">
      <Title level={6} color={titleColor}>
        {type}
      </Title>
      <Space>
        <Button type={type} theme={theme} mods={BASE_MODS}>
          Default
        </Button>
        <Button
          type={type}
          theme={theme}
          mods={{ ...BASE_MODS, hovered: true }}
        >
          Hovered
        </Button>
        <Button
          type={type}
          theme={theme}
          mods={{ ...BASE_MODS, pressed: true }}
        >
          Pressed
        </Button>
        <Button
          type={type}
          theme={theme}
          mods={{ ...BASE_MODS, hovered: true, pressed: true }}
        >
          Pressed&Hovered
        </Button>
        <Button
          type={type}
          theme={theme}
          mods={{ ...BASE_MODS, focused: true }}
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
      </Space>
      {hasSelected && (
        <>
          <Title level={6} color={titleColor}>
            {type} + selected
          </Title>
          <Space>
            <Button
              type={type}
              theme={theme}
              mods={{ ...BASE_MODS, selected: true }}
            >
              Default
            </Button>
            <Button
              type={type}
              theme={theme}
              mods={{ ...BASE_MODS, selected: true, hovered: true }}
            >
              Hovered
            </Button>
            <Button
              type={type}
              theme={theme}
              mods={{ ...BASE_MODS, selected: true, pressed: true }}
            >
              Pressed
            </Button>
            <Button
              type={type}
              theme={theme}
              mods={{
                ...BASE_MODS,
                selected: true,
                hovered: true,
                pressed: true,
              }}
            >
              Pressed&Hovered
            </Button>
            <Button
              type={type}
              theme={theme}
              mods={{ ...BASE_MODS, selected: true, focused: true }}
            >
              Focused
            </Button>
            <Button
              isDisabled
              type={type}
              theme={theme}
              mods={{
                selected: true,
                hovered: false,
                pressed: false,
                focused: false,
              }}
            >
              Disabled
            </Button>
          </Space>
        </>
      )}
    </Space>
  );
};

const ThemeStatesTemplate: StoryFn<CubeButtonProps> = ({ theme }) => {
  const isSpecial = theme === 'special';

  // `outline-2` uses `#surface-3` as its base fill (so it stands out on a
  // `#surface-2` container) and has no counterpart in the special theme,
  // which is anchored on the fixed `#special-surface` base.
  const visibleTypes = isSpecial
    ? BUTTON_TYPES.filter((type) => type !== 'outline-2')
    : BUTTON_TYPES;

  return (
    <Space
      flow="column"
      gap="3x"
      padding={isSpecial ? '2x' : undefined}
      fill={isSpecial ? '#black' : undefined}
      radius="1x"
    >
      {visibleTypes.map((type) =>
        SURFACE_2_TYPES.includes(type) ? (
          <Space
            key={type}
            flow="column"
            fill="#surface-2"
            padding="1.5x"
            radius="1x"
          >
            <TypeStatesRow key={type} type={type} theme={theme} />
          </Space>
        ) : (
          <TypeStatesRow key={type} type={type} theme={theme} />
        ),
      )}
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

export const DisabledWithTooltip: StoryFn<CubeButtonProps> = () => (
  <Space gap="2x" flow="column" placeItems="start">
    <Button
      qa="DisabledButton"
      isDisabled
      tooltip="Not enough permissions"
      type="primary"
    >
      Delete project
    </Button>
    <Button isDisabled tooltip="Nothing to export yet" icon={<IconCoin />}>
      Export
    </Button>
  </Space>
);

DisabledWithTooltip.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.findByTestId('DisabledButton');

  // React Aria opens a tooltip only when the last interaction came from a
  // pointer, and it learns that from a mouse move — which the leading
  // `unhover` provides. Without it the first hover of the page is ignored.
  await userEvent.unhover(button);
  await userEvent.hover(button);

  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};

DisabledWithTooltip.parameters = {
  docs: {
    description: {
      story:
        'A disabled button keeps showing its tooltip, which is usually where the reason for being unavailable is written. The disabled state is expressed with `aria-disabled` in that case, because the native `disabled` attribute would stop the browser from dispatching the hover that opens the tooltip. The button stays inert either way.',
    },
  },
};
