import { StoryFn } from '@storybook/react';

import { CubeHotKeysProps, HotKeys } from './HotKeys';

export default {
  title: 'Content/HotKeys',
  component: HotKeys,
  argTypes: {
    keys: {
      control: {
        type: 'text',
      },
      description: 'Key combination string (e.g., "mod+k, ctrl+k")',
      table: {
        type: { summary: 'string' },
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
  keys,
  label,
  description,
  ...props
}) => (
  <HotKeys
    keys={keys}
    aria-label={label}
    aria-description={description}
    {...props}
  />
);

export const Default = Template.bind({});
Default.args = {
  keys: 'mod+k',
};

export const SingleKey = Template.bind({});
SingleKey.args = {
  keys: 'enter',
  'aria-label': 'Submit action',
};

export const MultipleKeys = Template.bind({});
MultipleKeys.args = {
  keys: 'mod+shift+p',
  'aria-label': 'Command palette',
  'aria-description': 'Opens the command palette for quick actions',
};

export const Alternatives = Template.bind({});
Alternatives.args = {
  keys: 'mod+k, ctrl+k',
  'aria-label': 'Search',
  'aria-description': 'Opens the search dialog',
};

export const ComplexAlternatives = Template.bind({});
ComplexAlternatives.args = {
  keys: 'mod+shift+p, ctrl+shift+p, alt+space',
  'aria-label': 'Quick actions',
  'aria-description': 'Multiple ways to access quick actions menu',
};

export const FunctionKeys = Template.bind({});
FunctionKeys.args = {
  keys: 'f1, f2, f3',
  'aria-label': 'Help functions',
  'aria-description': 'Function keys for help, rename, and search',
};

export const ArrowKeys = Template.bind({});
ArrowKeys.args = {
  keys: 'up, down, left, right',
  'aria-label': 'Navigation',
  'aria-description': 'Arrow keys for directional navigation',
};

export const SpecialKeys = Template.bind({});
SpecialKeys.args = {
  keys: 'esc, enter, space, backspace, delete',
  'aria-label': 'Common actions',
  'aria-description': 'Frequently used special keys',
};

export const Mixed = Template.bind({});
Mixed.args = {
  keys: 'mod+c, ctrl+c, cmd+c',
  'aria-label': 'Copy',
  'aria-description': 'Copy selected content to clipboard',
};

export const WithCustomStyles = Template.bind({});
WithCustomStyles.args = {
  keys: 'mod+k, ctrl+k',
  'aria-label': 'Styled shortcuts',
  'aria-description': 'Custom styled keyboard shortcuts',
  styles: {
    padding: '2x',
    fill: '#purple.10',
    radius: '1r',
  },
};
