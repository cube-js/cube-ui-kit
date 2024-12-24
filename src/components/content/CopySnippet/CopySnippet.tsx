import { ReactNode, useMemo, useState } from 'react';
import copy from 'clipboard-copy';

import { Action, Button } from '../../actions';
import { Card, CubeCardProps } from '../Card/Card';
import { tasty } from '../../../tasty';
import {
  CubePrismCodeProps,
  PrismCode,
} from '../../content/PrismCode/PrismCode';
import { TooltipTrigger } from '../../overlays/Tooltip/TooltipTrigger';
import { Tooltip } from '../../overlays/Tooltip/Tooltip';
import { useToastsApi } from '../../overlays/Toasts';
import { CopyIcon, EyeIcon, EyeInvisibleIcon } from '../../../icons';

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
    overflow: 'auto',
    maxWidth: '100%',
    whiteSpace: {
      '': 'initial',
      nowrap: 'nowrap',
    },
    styledScrollbar: true,
    padding: {
      '': '1x 1.5x 0 1x',
      multiline: '1x 1.5x',
    },
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

    '@button-radius': {
      '': '0',
      multiline: '1r',
    },

    // border: 'left',
  },
});

const CopySnippetElement = tasty(Card, {
  qa: 'CopySnippet',
  styles: {
    display: 'grid',
    gridRows: 'minmax(0, 1fr)',
    fill: '#grey-light',
    border: 0,
    padding: 0,
    preset: 'default',
    radius: '1r',

    Grid: {
      display: 'grid',
      flow: 'row',
      gridColumns: 'minmax(0, 1fr) auto',
      gridRows: 'minmax(0, 1fr)',
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
    width: '4x',
    padding: 0,
    placeSelf: 'stretch',
    border: '#clear',
    outline: {
      '': '#purple-03.0',
      'focused & focus-visible': '#purple-03 inset',
    },
    height: '@button-size',
    radius: {
      '': '0',
      ':last-child': '0 0 0 @button-radius',
      ':first-child': '0 @button-radius 0 0',
      ':last-child & :first-child': '0 @button-radius 0 @button-radius',
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
    .split(/\n/g)
    .map((line) => `${prefix}${line} `)
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

export { _CopySnippet as CopySnippet };
