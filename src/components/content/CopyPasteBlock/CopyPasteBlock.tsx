import { forwardRef, ReactNode, useState } from 'react';
import { TextDropItem, useClipboard } from '@react-aria/dnd';
import { CopyOutlined } from '@ant-design/icons';
import copy from 'clipboard-copy';

import { Button } from '../../actions';
import { Card, CubeCardProps } from '../Card/Card';
import {
  extractStyles,
  POSITION_STYLES,
  PositionStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { useToastsApi } from '../../overlays/Toasts';
import { useTimer } from '../../../_internal';

const StyledBlock = tasty({
  styles: {
    position: 'relative',
    maxWidth: '100%',
    color: 'inherit',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: '0 1.5x',
  },
});

const CopyPasteBlockElement = tasty(Card, {
  qa: 'CopyPasteBlock',
  styles: {
    display: 'block',
    fill: '#grey-light',
    radius: '1r',
    padding: 0,
    color: {
      '': '#dark',
      error: '#danger-text',
    },
    border: {
      '': true,
      ':focus': '#purple',
      'error & :focus': '#danger',
    },
    transition: 'theme',
    cursor: 'pointer',
    preset: {
      '': 't3',
      '[data-size="large"]': 't2',
    },

    Grid: {
      display: 'grid',
      flow: 'row',
      gridColumns: 'auto min-content',
      placeItems: 'center stretch',
      width: 'min 20x',
      radius: '1r',
      position: 'relative',
    },
  },
});

const CopyButton = tasty(Button, {
  type: 'clear',
  icon: <CopyOutlined />,
  'aria-label': 'Copy to clipboard',
  styles: {
    placeSelf: {
      '': 'none',
      '!multiline & !with-scroll': 'stretch',
    },
    border: '#clear',
    outline: {
      '': '#purple-03.0',
      'focused & focus-visible': '#purple-03 inset',
    },
    radius: {
      '': '0 1r 1r 0',
      'multiline | with-scroll': '0 1r 0 0',
    },
  },
});

export interface CubeCopyPasteBlockProps
  extends CubeCardProps,
    PositionStyleProps {
  padding?: Styles['padding'];
  /** The code snippet */
  value: string;
  placeholder?: ReactNode;
  /** The title of the snippet */
  title?: string;
  onPaste?: (text: string) => void | Promise<void | string>;
  onCopy?: () => void;
  size?: 'small' | 'medium' | 'large';
}

function CopyPasteBlock(allProps: CubeCopyPasteBlockProps) {
  const {
    value = '',
    onPaste,
    placeholder,
    title,
    size = 'medium',
    ...props
  } = allProps;
  const styles = extractStyles(props, POSITION_STYLES);

  const [error, setError] = useState<string | null>(null);

  const { clipboardProps } = useClipboard({
    async onPaste(items) {
      let pasted = await Promise.all(
        items
          .filter(
            (item) => item.kind === 'text' && item.types.has('text/plain'),
          )
          .map((item) => (item as TextDropItem).getText('text/plain')),
      );
      try {
        await onPaste?.(pasted.join('\n'));
      } catch (e) {
        setError(String(e));
      }
    },
    getItems() {
      return value
        ? [
            {
              'text/plain': value,
            },
          ]
        : [];
    },
    onCopy() {
      if (value) {
        toast.success(`${title || 'Text'} copied`);
      }
    },
  });

  useTimer({
    delay: 1000,
    callback() {
      setError(null);
    },
    isDisabled: !error,
  });

  const { toast } = useToastsApi();

  async function onCopy() {
    await copy(value);

    toast.success(`${title || 'Text'} copied`);
  }

  const pristineValue = value.replace(/\n/, ' ');

  return (
    <CopyPasteBlockElement
      mods={{ error: !!error }}
      data-size={size}
      styles={styles}
      tabIndex="0"
      {...props}
      {...clipboardProps}
    >
      <div data-element="Grid">
        <StyledBlock
          data-size={size}
          mods={{
            placeholder: !!placeholder || !value,
          }}
        >
          {error != null ? (
            error || 'Invalid data'
          ) : value ? (
            pristineValue
          ) : (
            <>
              {placeholder ? placeholder : 'Select and paste'} <kbd>Cmd</kbd> +{' '}
              <kbd>V</kbd>
            </>
          )}
        </StyledBlock>
        <CopyButton
          isDisabled={!value}
          size={size}
          aria-label={`Copy ${title}`}
          onPress={onCopy}
        />
      </div>
    </CopyPasteBlockElement>
  );
}

const _CopyPasteBlock = forwardRef(CopyPasteBlock);

export { _CopyPasteBlock as CopyPasteBlock };
