import { ReactNode, useState } from 'react';
import { useClipboard, TextDropItem } from '@react-aria/dnd';
import { CopyOutlined } from '@ant-design/icons';
import copy from 'clipboard-copy';

import { Button } from '../../actions';
import { Card, CubeCardProps } from '../Card/Card';
import { Styles, tasty } from '../../../tasty';
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
  },
});

const ButtonContainer = tasty({
  styles: {
    position: 'relative',
    display: 'grid',
    gridAutoFlow: 'column',
    margin: '(-1x - 1bw) -1.5x (-1x - 1bw) -1x',
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

export interface CubeCopyPasteBlockProps extends CubeCardProps {
  padding?: Styles['padding'];
  /** The code snippet */
  value: string;
  placeholder?: ReactNode;
  /** The title of the snippet */
  title?: string;
  onPaste?: (text: string) => void | Promise<void | string>;
  onCopy?: () => void;
}

function CopyPasteBlock(allProps: CubeCopyPasteBlockProps) {
  const {
    value = '',
    onPaste,
    placeholder,
    padding = '1.125x 1.5x',
    title,
    styles,
    ...props
  } = allProps;
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
      styles={{ preset: 'default', ...styles }}
      tabIndex="0"
      {...props}
      {...clipboardProps}
    >
      <div data-element="Grid">
        <StyledBlock
          mods={{
            placeholder: !!placeholder || !value,
          }}
          styles={{ padding }}
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
        <ButtonContainer styles={{ padding } as Styles}>
          <CopyButton
            isDisabled={!value}
            aria-label={`Copy ${title}`}
            onPress={onCopy}
          />
        </ButtonContainer>
      </div>
    </CopyPasteBlockElement>
  );
}

const _CopyPasteBlock = Object.assign(
  CopyPasteBlock as typeof CopyPasteBlock & {
    Button: typeof ActionButton;
  },
  {
    Button: ActionButton,
  },
);

export { _CopyPasteBlock as CopyPasteBlock };
