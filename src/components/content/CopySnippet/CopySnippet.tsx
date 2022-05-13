import copy from 'clipboard-copy';
import { Action, Button } from '../../actions';
import { Card, CubeCardProps } from '../Card/Card';
import { Grid } from '../../layout/Grid';
import { Styles, tasty } from '../../../tasty';
import {
  CubePrismCodeProps,
  PrismCode,
} from '../../content/PrismCode/PrismCode';
import { notification } from '../../../services/notification';
import { CopyOutlined } from '@ant-design/icons';
import { CSSProperties } from 'react';
import { TooltipTrigger } from '../../overlays/Tooltip/TooltipTrigger';
import { Tooltip } from '../../overlays/Tooltip/Tooltip';

const POSITION_ACTION: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 1,
};

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

    '&::after': {
      display: {
        '': 'none',
        overlay: 'block',
      },
      content: '""',
      width: '2x',
      position: 'absolute',
      left: '-2x',
      top: 0,
      bottom: 0,
      backgroundImage:
        'linear-gradient(to right,rgba(var(--context-fill-color-rgb),0),rgba(var(--context-fill-color-rgb),1))',
    },
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
}

export function CopySnippet(allProps: CubeCopySnippetProps) {
  let {
    code,
    title,
    nowrap,
    prefix,
    language,
    showScroll = true,
    serif,
    children,
    padding,
    showOverlay = true,
    showTooltip = false,
    styles,
    ...props
  } = allProps;

  padding = padding || '1.125x 1.5x';

  const codeTitle = title || 'Code example';

  async function onCopy() {
    await copy(code);

    notification.success(`${codeTitle} copied`);
  }

  code = (code || '').replace(/\n$/, '');

  const multiline = code.includes('\n') && !nowrap;
  const formattedCode = code
    .split(/\n/g)
    .map((line) => `${prefix || ''}${line} `)
    .join('\n');

  styles = {
    preset: 'default',
    ...styles,
  } as Styles;

  const Snippet = (
    <Card
      data-qa="CopySnippet"
      fill="#grey-light"
      radius="1r"
      border={0}
      padding={0}
      styles={styles}
      {...props}
    >
      <Grid
        columns="minmax(0, 1fr) 5x"
        width="min 20x"
        radius="1r"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <StyledBlock
          mods={{
            nowrap,
            multiline,
            scroll: showScroll,
            serif,
          }}
          styles={{ padding } as Styles}
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
        />
        <Button
          label={`Copy ${codeTitle}`}
          type="clear"
          styles={{
            padding: '1x 1.5x',
            fontWeight: 500,
            radius: multiline || showScroll ? '0 1r' : '0 1r 1r 0',
            placeSelf: !multiline && !showScroll ? 'stretch' : 'none',
            border: '#clear',
            outline: {
              '': '#purple-03.0',
              'focused & focus-visible': '#purple-03 inset',
            },
          }}
          style={POSITION_ACTION}
          onPress={onCopy}
          icon={<CopyOutlined />}
        />
      </Grid>
    </Card>
  );

  if (showTooltip) {
    return (
      <TooltipTrigger>
        <Action styles={{ display: 'block', cursor: 'default', width: '100%' }}>
          {Snippet}
        </Action>
        <Tooltip>{formattedCode}</Tooltip>
      </TooltipTrigger>
    );
  }

  return Snippet;
}
