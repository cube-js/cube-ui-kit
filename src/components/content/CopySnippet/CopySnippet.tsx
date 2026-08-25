import { tasty } from '@tenphi/tasty';
import copy from 'clipboard-copy';
import { ReactNode, useMemo, useState } from 'react';

import { useI18n } from '../../../i18n';
import { CopyIcon } from '../../../icons/CopyIcon';
import { EyeIcon } from '../../../icons/EyeIcon';
import { EyeInvisibleIcon } from '../../../icons/EyeInvisibleIcon';
import { Action, Button } from '../../actions';
import {
  CubePrismCodeProps,
  PrismCode,
} from '../../content/PrismCode/PrismCode';
import { useToast } from '../../overlays/Toast';
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

    Code: {
      $: 'code',
      preset: {
        '': 's3',
        serif: 't3',
      },
      // `s3` carries `fontFamily: var(--font-mono)` but `t3` sets no family at
      // all, so the preset alone cannot express "serif". Left to the preset, the
      // `serif` variant would inherit the `<code>` element's UA monospace
      // default and render monospace anyway. Keep the family explicit:
      // `font: 'monospace'` for the default, `font: true` for the design
      // system's default (non-mono) stack under `serif`.
      font: {
        '': 'monospace',
        serif: true,
      },
      // The wrapping itself (`white-space` / `overflow-wrap` on the `<code>`)
      // is owned by `PrismCode` via its `isWrapped` prop, which this component
      // forwards.
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

    '$button-size': {
      '': '5x',
      multiline: '4x',
    },

    '$first-button-radius': {
      '': '0 1r 1r 0',
      multiline: '0 1r 0 0',
    },

    '$last-button-radius': {
      '': '0',
      multiline: '0 0 0 1r',
    },

    '$first-and-last-button-radius': {
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
    fill: '#surface-2',
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
    height: '$button-size',
    radius: {
      '': 0,
      ':last-child': '$last-button-radius',
      ':first-child': '$first-button-radius',
      ':first-child & :last-child': '$first-and-last-button-radius',
    },
  },
});

const CopyButton = tasty(ActionButton, {
  icon: <CopyIcon />,
});

const ShowButton = tasty(ActionButton, {});

export interface CubeCopySnippetProps extends CubeCardProps {
  /** The code snippet */
  code: string;
  /** The title of the snippet */
  title?: string;
  /** Whether the snippet is single-lined */
  nowrap?: boolean;
  /**
   * Soft-wrap long content onto multiple lines instead of scrolling it
   * horizontally. The block grows vertically to fit (so even a single long line
   * is fully readable rather than clamped), and unbreakable runs like URLs,
   * tokens and identifiers wrap too. Useful for error messages and logs.
   * Has no effect when `nowrap` is set. Note this is a different axis from
   * `nowrap`: `nowrap` collapses real newlines into one scrolling line, while
   * `isWrapped` breaks long lines that would otherwise scroll.
   */
  isWrapped?: boolean;
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
  const { t } = useI18n();

  const {
    code = '',
    title = t('copySnippet.title', 'Code example'),
    nowrap,
    isWrapped,
    prefix = '',
    language,
    serif,
    actions,
    showTooltip = false,
    hideText,
    ...props
  } = allProps;

  const toast = useToast();

  const [showHidden, setShowHidden] = useState(false);

  async function onCopy() {
    await copy(code);

    toast.success(t('copySnippet.copied', '{{title}} copied', { title }));
  }

  const pristineCode = code.replace(/\n$/, '');

  const multiline = pristineCode.includes('\n') && !nowrap;
  // `isWrapped` reuses the multiline block layout (auto height, no right fade,
  // copy button on top) so wrapped content grows vertically instead of being
  // clamped to the single-line height. `nowrap` (force one scrolling line) wins
  // over it.
  const shouldWrap = !!isWrapped && !nowrap;
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
      multiline: multiline || shouldWrap,
      serif,
      hidden: !!hideText,
    };
  }, [nowrap, multiline, shouldWrap, hideText, serif]);

  const Snippet = (
    <CopySnippetElement mods={mods} {...props}>
      <div data-element="Grid">
        <StyledBlock mods={mods}>
          <PrismCode
            style={{ margin: 0, overflow: 'visible' }}
            code={formattedCode}
            language={language || 'javascript'}
            isWrapped={shouldWrap}
          />
        </StyledBlock>
        <ButtonContainer mods={mods}>
          <CopyButton
            aria-label={t(
              'copySnippet.copyToClipboard',
              'Copy {{title}} to clipboard',
              { title },
            )}
            onPress={onCopy}
          />
          {hideText && (
            <ShowButton
              aria-label={t('copySnippet.showHiddenParts', 'Show hidden parts')}
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
