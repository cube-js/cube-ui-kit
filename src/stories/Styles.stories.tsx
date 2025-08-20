import { StoryFn } from '@storybook/react-vite';

import { Block, CubeBlockProps } from '../index';

const FadeTemplate: StoryFn<CubeBlockProps> = ({ children, ...props }) => {
  return (
    <Block padding="2x" fill="#border">
      <Block fill="#purple" width="100px" height="100px" {...props}>
        {children}
      </Block>
    </Block>
  );
};

const InsetTemplate: StoryFn<CubeBlockProps> = ({ children, ...props }) => {
  return (
    <Block fill="#border" height="100px" position="relative">
      <Block
        position="absolute"
        fill="#purple"
        width="16px"
        height="16px"
        {...props}
      >
        {children}
      </Block>
    </Block>
  );
};

export default {
  title: 'Generic/Styles',
  component: Block,
};

export const InsetTop = {
  render: InsetTemplate.bind({}),

  args: {
    styles: {
      inset: 'top',
    },
  },
};

export const InsetTopRight = {
  render: InsetTemplate.bind({}),

  args: {
    styles: {
      inset: 'top right',
    },
  },
};

export const InsetBottomRight = {
  render: InsetTemplate.bind({}),

  args: {
    styles: {
      inset: 'bottom right',
    },
  },
};

export const InsetBottomLeft = {
  render: InsetTemplate.bind({}),

  args: {
    styles: {
      inset: 'bottom left',
    },
  },
};

export const InsetTopLeftIndent = {
  render: InsetTemplate.bind({}),

  args: {
    styles: {
      inset: '2x bottom left',
    },
  },
};

export const InsetTopLeftComplexIndent = {
  render: InsetTemplate.bind({}),

  args: {
    styles: {
      inset: '2x bottom 4x left',
    },
  },
};

export const FadeTop = {
  render: FadeTemplate.bind({}),

  args: {
    styles: {
      fade: 'top',
    },
  },
};

export const FadeRight = {
  render: FadeTemplate.bind({}),

  args: {
    styles: {
      fade: 'right',
    },
  },
};

export const FadeBottom = {
  render: FadeTemplate.bind({}),

  args: {
    styles: {
      fade: 'bottom',
    },
  },
};

export const FadeLeft = {
  render: FadeTemplate.bind({}),

  args: {
    styles: {
      fade: 'left',
    },
  },
};

export const FadeCustomTop = {
  render: FadeTemplate.bind({}),

  args: {
    styles: {
      fade: '50% top',
    },
  },
};

export const FadeHorizontal = {
  render: FadeTemplate.bind({}),

  args: {
    styles: {
      fade: 'left right',
    },
  },
};

export const FadeVertical = {
  render: FadeTemplate.bind({}),

  args: {
    styles: {
      fade: 'top bottom',
    },
  },
};

export const FadeAllDirections = {
  render: FadeTemplate.bind({}),

  args: {
    styles: {
      fade: true,
    },
  },
};
