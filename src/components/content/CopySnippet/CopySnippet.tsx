import { ReactNode, useState } from 'react';
import {
  CopyOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import copy from 'clipboard-copy';

import { Action, Button } from '../../actions';
import { Card, CubeCardProps } from '../Card/Card';
import { Styles, tasty } from '../../../tasty';
import {
  CubePrismCodeProps,
  PrismCode,
} from '../../content/PrismCode/PrismCode';
import { TooltipTrigger } from '../../overlays/Tooltip/TooltipTrigger';
import { Tooltip } from '../../overlays/Tooltip/Tooltip';
import { useToastsApi } from '../../overlays/Toasts';

const ActionElement = tasty(Action, {
  styles: {
    display: 'block',
    cursor: 'default',
    width: '100%',
  },
});

const StyledBlock = tasty({
  styles: {
    position: 'relative',
    overflow: {
      '': 'hidden',
      scroll: 'auto hidden',
    },
    maxWidth: '100%',
    whiteSpace: {
      '': 'initial',
      nowrap: 'nowrap',
    },
    styledScrollbar: true,

    '& code': {
      font: {
        '': 'monospace',
        serif: true,
      },
    },
  },
});

const ButtonContainer = tasty({
  styles: {
    position: 'relative',
    display: 'grid',
    gridAutoFlow: 'column',
    margin: '(-1x - 1bw) -1.5x (-1x - 1bw) -1x',

    '&::after': {
      display: {
        '': 'none',
        overlay: 'block',
      },
      content: '""',
      width: '2x',
      position: 'absolute',
      left: '-1x',
      top: 0,
      bottom: 0,
      backgroundImage:
        'linear-gradient(to right,rgba(var(--context-fill-color-rgb),0),rgba(var(--context-fill-color-rgb),1))',
    },
  },
});

const CopySnippetElement = tasty(Card, {
  qa: 'CopySnippet',
  styles: {
    display: 'block',
    fill: '#grey-light',
    radius: '1r',
    border: 0,
    padding: 0,

    Grid: {
      display: 'grid',
      flow: 'row',
      gridColumns: 'minmax(0, 1fr) auto',
      width: 'min 20x',
      radius: '1r',
      position: 'relative',
      overflow: 'hidden',
    },
  },
});

const ActionButton = tasty(Button, {
  type: 'clear',
  styles: {
    padding: '1x 1.5x',
    radius: 0,
    placeSelf: {
      '': 'none',
      '!multiline & !with-scroll': 'stretch',
    },
    border: '#clear',
    outline: {
      '': '#purple-03.0',
      'focused & focus-visible': '#purple-03 inset',
    },
  },
});

const CopyButton = tasty(ActionButton, {
  icon: <CopyOutlined />,
  'aria-label': 'Copy to clipboard',
  styles: {
    radius: {
      '': '0 1r 1r 0',
      'multiline | with-scroll': '0 1r 0 0',
    },
  },
});

const ShowButton = tasty(ActionButton, {
  'aria-label': 'Show hidden parts',
  styles: {
    radius: 0,
  },
});

export interface CubeCopySnippetProps extends CubeCardProps {
  padding?: Styles['padding'];
  /** The code snippet */
  code: string;
  /** The title of the snippet */
  title?: string;
  /** Whether the snippet is single-lined */
  nowrap?: boolean;
  /** The prefix for each line of code. Useful for bash snippets. */
  prefix?: string;
  /** The code language of the snippet */
  language?: CubePrismCodeProps['language'];
  /** Whether the snippet uses a serif font */
  serif?: boolean;
  /** Whether the snippet uses overlay on the edge */
  showOverlay?: boolean;
  /** Whether the snippet is scrollable */
  showScroll?: boolean;
  /** Whether to show the tooltip with the full content */
  showTooltip?: boolean;
  hideText?: string[] | string | boolean;
  actions?: ReactNode;
}

// const HIDDEN_SYMBOL = '●';
const HIDDEN_SYMBOL = '•';

function CopySnippet(allProps: CubeCopySnippetProps) {
  const {
    code = '',
    title = 'Code example',
    nowrap,
    prefix = '',
    language,
    showScroll = true,
    serif,
    actions,
    padding = '1.125x 1.5x',
    showOverlay = true,
    showTooltip = false,
    styles,
    hideText,
    ...props
  } = allProps;

  const { toast } = useToastsApi();

  const [showHidden, setShowHidden] = useState(false);

  async function onCopy() {
    await copy(code);

    toast.success(`${title} copied`);
  }

  const pristineCode = code.replace(/\n$/, '');

  const multiline = pristineCode.includes('\n') && !nowrap;
  let formattedCode = pristineCode
    .split(/\n/g)
    .map((line) => `${prefix}${line} `)
    .join('\n');

  if (!showHidden) {
    if (hideText === true) {
      formattedCode = formattedCode
        .split('')
        .map((s) => HIDDEN_SYMBOL)
        .join('');
    } else if (typeof hideText === 'string') {
      formattedCode = formattedCode.replaceAll(
        hideText,
        hideText
          .split('')
          .map((s) => HIDDEN_SYMBOL)
          .join(''),
      );
    } else if (Array.isArray(hideText)) {
      hideText.forEach((text) => {
        formattedCode = formattedCode.replaceAll(
          text,
          text
            .split('')
            .map((s) => HIDDEN_SYMBOL)
            .join(''),
        );
      });
    }
  }

  const Snippet = (
    <CopySnippetElement styles={{ preset: 'default', ...styles }} {...props}>
      <div data-element="Grid">
        <StyledBlock
          mods={{ nowrap, multiline, scroll: showScroll, serif }}
          styles={{ padding }}
        >
          <PrismCode
            style={{ margin: 0, overflow: 'visible' }}
            code={formattedCode}
            language={language || 'javascript'}
          />
        </StyledBlock>
        <ButtonContainer
          styles={{ padding } as Styles}
          mods={{ overlay: showOverlay }}
        >
          {actions}
          {hideText && (
            <ShowButton
              icon={showHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              mods={{ multiline, withScroll: showScroll }}
              onPress={() => setShowHidden(!showHidden)}
            />
          )}
          <CopyButton
            label={`Copy ${title}`}
            mods={{ multiline, withScroll: showScroll, hidden: !!hideText }}
            onPress={onCopy}
          />
        </ButtonContainer>
      </div>
    </CopySnippetElement>
  );

  if (showTooltip) {
    return (
      <TooltipTrigger>
        <ActionElement>{Snippet}</ActionElement>
        <Tooltip>{formattedCode}</Tooltip>
      </TooltipTrigger>
    );
  }

  return Snippet;
}

const _CopySnippet = Object.assign(
  CopySnippet as typeof CopySnippet & {
    Button: typeof ActionButton;
  },
  {
    Button: ActionButton,
  },
);

export { _CopySnippet as CopySnippet };
