import copy from 'clipboard-copy';
import { ReactNode, useMemo, useState } from 'react';

import { CopyIcon, EyeIcon, EyeInvisibleIcon } from '../../../icons';
import { tasty } from '../../../tasty';
import { Action, Button } from '../../actions';
import {
  CubePrismCodeProps,
  PrismCode,
} from '../../content/PrismCode/PrismCode';
import { useToastsApi } from '../../overlays/Toasts';
import { Tooltip } from '../../overlays/Tooltip/Tooltip';
import { TooltipTrigger } from '../../overlays/Tooltip/TooltipTrigger';
import { Card, CubeCardProps } from '../Card/Card';

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
      '': 'auto clip',
      multiline: 'auto',
    },
    width: 'initial auto 100%',
    height: {
      '': 'max 5x',
      multiline: 'auto',
    },
    boxSizing: 'border-box',
    whiteSpace: {
      '': 'initial',
      nowrap: 'nowrap',
    },
    scrollbar: 'styled',
    padding: '1.125x 1.5x',
    fade: {
      '': 'right 2x',
      multiline: false,
    },

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
    display: 'flex',
    flow: {
      '': 'row-reverse',
      multiline: 'column',
    },
    placeContent: 'start',

    '@button-size': {
      '': '5x',
      multiline: '4x',
    },

    '@first-button-radius': {
      '': '0 1r 1r 0',
      multiline: '0 1r 0 0',
    },

    '@last-button-radius': {
      '': '0',
      multiline: '0 0 0 1r',
    },

    '@first-and-last-button-radius': {
      '': '0 1r 1r 0',
      multiline: '0 1r 0 1r',
    },

    // Make sure there's a small gap between buttons and the content
    border: 'left #clear',
  },
});

const CopySnippetElement = tasty(Card, {
  qa: 'CopySnippet',
  styles: {
    display: 'grid',
    gridRows: 'minmax(0, 1fr)',
    fill: '#dark-bg',
    border: 0,
    padding: 0,
    preset: 'default',
    radius: '1r',
    overflow: 'hidden',
    height: 'max-content',

    Grid: {
      display: 'grid',
      flow: 'row',
      gridColumns: 'minmax(0, 1fr) auto',
      gridRows: 'minmax(0, 1fr)',
      width: 'min 20x',
      position: 'relative',
    },
  },
});

const ActionButton = tasty(Button, {
  type: 'clear',
  styles: {
    width: '4x',
    padding: 0,
    placeSelf: 'stretch',
    border: '#clear',
    shadow: {
      '': 'inset 0 0 0 1ow #purple-03.0',
      focused: 'inset 0 0 0 1ow #purple-03',
    },
    outline: false,
    height: '@button-size',
    radius: {
      '': 0,
      ':last-child': '@last-button-radius',
      ':first-child': '@first-button-radius',
      ':first-child & :last-child': '@first-and-last-button-radius',
    },
  },
});

const CopyButton = tasty(ActionButton, {
  icon: <CopyIcon />,
  'aria-label': 'Copy to clipboard',
});

const ShowButton = tasty(ActionButton, {
  'aria-label': 'Show hidden parts',
});

export interface CubeCopySnippetProps extends CubeCardProps {
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
  /** Whether to show the tooltip with the full content */
  showTooltip?: boolean;
  hideText?: string[] | string | boolean;
  actions?: ReactNode;
}

// const HIDDEN_SYMBOL = '●';
const HIDDEN_SYMBOL = '•';

function replaceSymbolsToHidden(str: string) {
  return HIDDEN_SYMBOL.repeat(str.length);
}

function CopySnippet(allProps: CubeCopySnippetProps) {
  const {
    code = '',
    title = 'Code example',
    nowrap,
    prefix = '',
    language,
    serif,
    actions,
    showTooltip = false,
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
    .replace(/\r/g, '')
    .split(/\n/g)
    .map((line) => `${prefix}${line}`)
    .join('\n')
    .trim();

  if (!showHidden) {
    if (hideText === true) {
      formattedCode = replaceSymbolsToHidden(formattedCode);
    } else if (typeof hideText === 'string') {
      formattedCode = formattedCode.replaceAll(
        hideText,
        replaceSymbolsToHidden(hideText),
      );
    } else if (Array.isArray(hideText)) {
      hideText.forEach((text) => {
        formattedCode = formattedCode.replaceAll(
          text,
          replaceSymbolsToHidden(text),
        );
      });
    }
  }

  const mods = useMemo(() => {
    return {
      nowrap,
      multiline,
      serif,
      hidden: !!hideText,
    };
  }, [nowrap, multiline, hideText, serif]);

  const Snippet = (
    <CopySnippetElement mods={mods} {...props}>
      <div data-element="Grid">
        <StyledBlock mods={mods}>
          <PrismCode
            style={{ margin: 0, overflow: 'visible' }}
            code={formattedCode}
            language={language || 'javascript'}
          />
        </StyledBlock>
        <ButtonContainer mods={mods}>
          <CopyButton aria-label={`Copy ${title}`} onPress={onCopy} />
          {hideText && (
            <ShowButton
              icon={showHidden ? <EyeInvisibleIcon /> : <EyeIcon />}
              onPress={() => setShowHidden(!showHidden)}
            />
          )}
          {actions}
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

(_CopySnippet as any).displayName = 'CopySnippet';

export { _CopySnippet as CopySnippet };
