import { StoryFn } from '@storybook/react-vite';
import {
  IconCaretDown,
  IconCoin,
  IconHeart,
  IconHeartFilled,
} from '@tabler/icons-react';
import { ReactNode, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { Title } from '../../content/Title';
import { Space } from '../../layout/Space';

import { Button, CubeButtonProps } from './Button';

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default {
  title: 'Actions/Button',
  component: Button,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Visual presentation */
    type: {
      options: ['primary', 'invert', 'outline', 'outline-2', 'clear', 'link'],
      control: { type: 'radio' },
      description: 'Visual style variant of the button',
      table: {
        defaultValue: { summary: 'outline' },
      },
    },
    theme: {
      options: [
        'default',
        'danger',
        'success',
        'warning',
        'note',
        'special',
        'current',
      ],
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
  'invert',
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
  // On `current` the heading rides the container's own color, the same way the
  // buttons under it do.
  const titleColor =
    theme === 'special'
      ? '#white'
      : theme === 'current'
        ? '#current'
        : undefined;
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
  // `current` mixes every color from the inherited text color, so it only means
  // anything inside a container that paints one — the whole sweep therefore runs
  // inside a colored block. `CurrentTheme` below sweeps the other contexts.
  const isCurrent = theme === 'current';

  // `outline-2` uses `#surface-3` as its base fill (so it stands out on a
  // `#surface-2` container) and has no counterpart in the special theme,
  // which is anchored on the fixed `#special-surface` base.
  const visibleTypes = BUTTON_TYPES.filter(
    (type) => !(isSpecial && type === 'outline-2'),
  );

  return (
    <Space
      flow="column"
      gap="3x"
      padding={isSpecial || isCurrent ? '2x' : undefined}
      fill={isSpecial ? '#black' : isCurrent ? '#note-surface' : undefined}
      color={isCurrent ? '#note-accent-text' : undefined}
      radius="1x"
    >
      {visibleTypes.map((type) =>
        SURFACE_2_TYPES.includes(type) ? (
          <Space
            key={type}
            flow="column"
            // `current` has no opaque base to swap, so the "one rung up the
            // surface ladder" container is a tint of the inherited color rather
            // than `#surface-2`.
            fill={isCurrent ? '#current.08' : '#surface-2'}
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

export const CurrentStates = ThemeStatesTemplate.bind({});
CurrentStates.args = {
  theme: 'current',
};

CurrentStates.parameters = {
  docs: {
    description: {
      story:
        'Every type, every state, on the `current` theme. Nothing here names a color: the block is painted `#note-surface` / `#note-accent-text` and each button mixes its fill, border and label from that inherited text color. `primary` and `invert` are the same two colors in opposite roles — `primary` fills with the inherited color and punches the page (`#surface`) out of it, `invert` fills with the page and writes the inherited color on top — which is how `invert` is built on this theme, there being no `accent-text` to fill with. `outline-2` sits in a `#current.08` panel, the `current` stand-in for the `#surface-2` container `outline-2` is drawn for. Swap the block color and the whole sweep follows it; `CurrentTheme` below does exactly that across seven containers.',
    },
  },
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
      <Button onPress={() => setIsLoading((prev) => !prev)}>
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
      // `delay: 0` only so the snapshot does not depend on the open delay
      tooltip={{ title: 'Not enough permissions', delay: 0 }}
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

  // `TooltipProvider` wires the trigger up in a mount effect, so a hover fired
  // before that lands is dropped with nothing to replay it.
  await timeout(250);

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

// Contexts the `current` theme is meant to live in: each one paints its own text
// color, and the button is expected to adopt it whatever its type.
// The two containers that INVERT the surface have to tell the filled `current`
// flavours what to write with: they paint `#white`, so `currentcolor` collides
// with `#surface` and the labels vanish. It takes two offers, because the two
// flavours sit on different chips:
//
//   --current-label   `primary`, whose chip is the inherited color — here a
//                     scheme-fixed `#white`, so the label must be dark in BOTH
//                     schemes. The container's own fill is exactly that, and
//                     contrasts with its own text by construction.
//   --current-accent  `invert`, whose chip is `#surface` — which flips, so the
//                     label has to flip with it. `#surface-text` is the page's
//                     own text color and therefore always contrasts with it.
//
// One value cannot do both: on `#fixed-dark`, offering the fill alone drops
// `invert` to cr 1.00 in dark, and offering `#surface-text` alone drops
// `primary` to 1.12. The tinted containers need neither and leave both unset.
const CURRENT_CONTEXTS = [
  { label: 'Page surface (inherited)', fill: undefined, color: undefined },
  { label: 'Danger', fill: '#danger-surface', color: '#danger-accent-text' },
  { label: 'Success', fill: '#success-surface', color: '#success-accent-text' },
  { label: 'Note', fill: '#note-surface', color: '#note-accent-text' },
  { label: 'Warning', fill: '#warning-surface', color: '#warning-accent-text' },
  {
    label: 'Dark banner',
    fill: '#fixed-dark',
    color: '#white',
    label_: '#fixed-dark',
    accent: '#surface-text',
  },
  {
    label: 'Brand',
    fill: '#primary',
    color: '#white',
    label_: '#primary',
    accent: '#surface-text',
  },
] as const;

const CurrentContext = ({
  label,
  fill,
  color,
  accent,
  label_,
  children,
}: {
  label: string;
  fill?: string;
  color?: string;
  /** `--current-accent` — what `invert` writes on its `#surface` chip. */
  accent?: string;
  /** `--current-label` — what `primary` writes on its `currentcolor` chip. */
  label_?: string;
  children: ReactNode;
}) => (
  <Space
    flow="column"
    padding="1.5x"
    radius="1x"
    border={fill ? undefined : true}
    fill={fill}
    color={color}
    styles={
      accent || label_
        ? {
            ...(accent ? { '$current-accent': accent } : null),
            ...(label_ ? { '$current-label': label_ } : null),
          }
        : undefined
    }
  >
    <Title level={6} color={color}>
      {label}
    </Title>
    {children}
  </Space>
);

export const CurrentTheme: StoryFn<CubeButtonProps> = () => (
  <Space flow="column" gap="3x">
    <Title level={5}>Inherited Colors</Title>
    {CURRENT_CONTEXTS.map(({ label, fill, color, ...rest }) => (
      <CurrentContext
        key={label}
        accent={'accent' in rest ? rest.accent : undefined}
        color={color}
        fill={fill}
        label={label}
        label_={'label_' in rest ? rest.label_ : undefined}
      >
        <Space>
          <Button theme="current" icon={<IconCoin />}>
            Default
          </Button>
          <Button isSelected theme="current" icon={<IconCoin />}>
            Selected
          </Button>
          <Button isDisabled theme="current" icon={<IconCoin />}>
            Disabled
          </Button>
          <Button isLoading theme="current" icon={<IconCoin />}>
            Loading
          </Button>
          <Button theme="current" icon={<IconCoin />} />
        </Space>
      </CurrentContext>
    ))}

    <Title level={5}>Every Type</Title>
    <Title level={6}>
      `current` composes with the shape axis: the same inherited color, five
      different amounts of emphasis.
    </Title>
    {[
      { label: 'Note', fill: '#note-surface', color: '#note-accent-text' },
      {
        label: 'Dark banner',
        fill: '#fixed-dark',
        color: '#white',
        label_: '#fixed-dark',
        accent: '#surface-text',
      },
    ].map(({ label, fill, color, ...rest }) => (
      <CurrentContext
        key={label}
        accent={'accent' in rest ? rest.accent : undefined}
        color={color}
        fill={fill}
        label={label}
        label_={'label_' in rest ? rest.label_ : undefined}
      >
        <Space placeItems="center">
          {BUTTON_TYPES.map((type) => (
            <Button key={type} theme="current" type={type}>
              {type}
            </Button>
          ))}
        </Space>
      </CurrentContext>
    ))}

    <Title level={5}>Resting Fill Calibration</Title>
    <Title level={6}>
      Ships with `#current.03`; these override only the resting fill, so the
      step can be compared against the same hover (`.07`) and border (`.08`).
    </Title>
    {[
      { label: 'On page surface', fill: undefined, color: undefined },
      { label: 'On #surface-2', fill: '#surface-2', color: undefined },
      { label: 'On dark', fill: '#fixed-dark', color: '#white' },
    ].map(({ label, fill, color }) => (
      <CurrentContext key={label} color={color} fill={fill} label={label}>
        <Space>
          {['.02', '.03', '.04', '.05'].map((alpha) => (
            <Button
              key={alpha}
              styles={{ fill: `#current${alpha}` }}
              theme="current"
            >
              {alpha === '.03' ? `${alpha} (current)` : alpha}
            </Button>
          ))}
        </Space>
      </CurrentContext>
    ))}

    <Title level={5}>Sizes</Title>
    <CurrentContext color="#note-accent-text" fill="#note-surface" label="Note">
      <Space placeItems="center">
        {(['xsmall', 'small', 'medium', 'large', 'xlarge'] as const).map(
          (size) => (
            <Button key={size} size={size} theme="current" icon={<IconCoin />}>
              {size}
            </Button>
          ),
        )}
      </Space>
    </CurrentContext>
  </Space>
);

CurrentTheme.parameters = {
  docs: {
    description: {
      story:
        'The `current` theme derives its colors — fill, border, label — from the inherited text color (`currentcolor`), so a button adopts whatever color its container paints with. It sits on the `theme` axis rather than the `type` axis because it is a color source, not a shape: every type has a `current` flavour, so emphasis is still chosen the usual way. `outline` (the default) is a `#current.03` chip inside a `#current.08` border, with hover, pressed and selected stepping the same alpha ramp; `primary` starts that ramp at `#current.14`; `clear` paints nothing at rest; `link` is the label alone. The label stays fully opaque and the focus ring stays `#primary-accent-text`, like every other theme. Use it inside colored containers — alerts, banners, dark overlays, tooltips — where a brand theme would either clash with the container or have to be picked to match it.',
    },
  },
};

CurrentTheme.args = {};
