import { StoryFn } from '@storybook/react-vite';

import { Block } from '../../Block';
import { Flow } from '../../layout/Flow';
import { Text } from '../Text';

import { CubeHotKeysProps, HotKeys } from './HotKeys';

export default {
  title: 'Content/HotKeys',
  component: HotKeys,
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
      description: 'Key combination string (e.g., "mod+k, ctrl+k")',
      table: {
        type: { summary: 'string' },
      },
    },
    type: {
      control: {
        type: 'select',
      },
      options: ['default', 'primary', 'inherit'],
      description:
        'Visual appearance type: default (subtle), primary (high contrast), or inherit (adapts to parent color)',
      table: {
        type: { summary: "'default' | 'primary' | 'inherit'" },
        defaultValue: { summary: 'default' },
      },
    },
    'aria-label': {
      control: {
        type: 'text',
      },
      description: 'Accessible label for the keyboard shortcuts',
      table: {
        type: { summary: 'string' },
      },
    },
    'aria-description': {
      control: {
        type: 'text',
      },
      description: 'Additional description for the keyboard shortcuts',
      table: {
        type: { summary: 'string' },
      },
    },
  },
};

const Template: StoryFn<CubeHotKeysProps> = ({
  children,
  label,
  description,
  ...props
}) => (
  <HotKeys aria-label={label} aria-description={description} {...props}>
    {children}
  </HotKeys>
);

export const Default = Template.bind({});
Default.args = {
  children: 'mod+k',
};

export const SingleKey = Template.bind({});
SingleKey.args = {
  children: 'enter',
  'aria-label': 'Submit action',
};

export const MultipleKeys = Template.bind({});
MultipleKeys.args = {
  children: 'mod+shift+p',
  'aria-label': 'Command palette',
  'aria-description': 'Opens the command palette for quick actions',
};

export const Alternatives = Template.bind({});
Alternatives.args = {
  children: 'mod+k, ctrl+k',
  'aria-label': 'Search',
  'aria-description': 'Opens the search dialog',
};

export const ComplexAlternatives = Template.bind({});
ComplexAlternatives.args = {
  children: 'mod+shift+p, ctrl+shift+p, alt+space',
  'aria-label': 'Quick actions',
  'aria-description': 'Multiple ways to access quick actions menu',
};

export const FunctionKeys = Template.bind({});
FunctionKeys.args = {
  children: 'f1, f2, f3',
  'aria-label': 'Help functions',
  'aria-description': 'Function keys for help, rename, and search',
};

export const ArrowKeys = Template.bind({});
ArrowKeys.args = {
  children: 'up, down, left, right',
  'aria-label': 'Navigation',
  'aria-description': 'Arrow keys for directional navigation',
};

export const SpecialKeys = Template.bind({});
SpecialKeys.args = {
  children: 'esc, enter, space, backspace, delete',
  'aria-label': 'Common actions',
  'aria-description': 'Frequently used special keys',
};

export const Mixed = Template.bind({});
Mixed.args = {
  children: 'mod+c, ctrl+c, cmd+c',
  'aria-label': 'Copy',
  'aria-description': 'Copy selected content to clipboard',
};

export const WithCustomStyles = Template.bind({});
WithCustomStyles.args = {
  children: 'mod+k, ctrl+k',
  'aria-label': 'Styled shortcuts',
  'aria-description': 'Custom styled keyboard shortcuts',
  styles: {
    padding: '2x',
    fill: '#purple.10',
    radius: '1r',
  },
};

export const Primary: StoryFn<CubeHotKeysProps> = (args) => (
  <Block padding="2x" fill="#surface-inverse" radius="1r">
    <HotKeys {...args} />
  </Block>
);
Primary.args = {
  children: 'mod+k',
  type: 'primary',
  'aria-label': 'Search',
};

export const Inherit = Template.bind({});
Inherit.args = {
  children: 'mod+k',
  type: 'inherit',
  'aria-label': 'Search',
};

export const InheritInContext: StoryFn<CubeHotKeysProps> = () => (
  <Flow gap="2x">
    <Block color="#purple-text">
      <Text>Press </Text>
      <HotKeys type="inherit" aria-label="Search">
        mod+k
      </HotKeys>
      <Text> to search (blue context)</Text>
    </Block>
    <Block color="#danger-text">
      <Text>Press </Text>
      <HotKeys type="inherit" aria-label="Delete">
        delete
      </HotKeys>
      <Text> to delete (red context)</Text>
    </Block>
    <Block color="#success-text">
      <Text>Press </Text>
      <HotKeys type="inherit" aria-label="Save">
        mod+s
      </HotKeys>
      <Text> to save (green context)</Text>
    </Block>
    <Block color="#purple-text">
      <Text>Press </Text>
      <HotKeys type="inherit" aria-label="Command palette">
        mod+shift+p
      </HotKeys>
      <Text> for commands (purple context)</Text>
    </Block>
  </Flow>
);
InheritInContext.parameters = {
  docs: {
    description: {
      story:
        "The inherit type adapts to the parent element's text color, making it perfect for use within colored text contexts.",
    },
  },
};
