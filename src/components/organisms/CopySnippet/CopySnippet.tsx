import copy from 'clipboard-copy';
import { Block } from '../../Block';
import { Button } from '../../actions/Button/Button';
import { Card, CubeCardProps } from '../../content/Card/Card';
import { Grid } from '../../layout/Grid';
import {
  CubePrismCodeProps,
  PrismCode,
} from '../../content/PrismCode/PrismCode';
import { notification } from '../../../services/notification';
import { CopyOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Styles } from '../../../styles/types';
import { CSSProperties } from 'react';
import { TooltipTrigger } from '../../overlays/Tooltip/TooltipTrigger';
import { Action } from '../../actions/Action';
import { Tooltip } from '../../overlays/Tooltip/Tooltip';

const POSITION_ACTION: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 1,
};

const StyledBlock = styled(Block)`
  position: relative;
  overflow: ${({ showScroll }) => (showScroll ? 'auto hidden' : 'hidden')};
  max-width: 100%;
  ${({ nowrap }) => (nowrap ? 'white-space: nowrap;' : '')}

  ${({ serif }) => (serif ? '&&& code { font-family: var(--font); }' : '')}

  ::-webkit-scrollbar-track {
    background: var(--grey-light-color);
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background: var(--dark-04-color);
    background-clip: padding-box;
    border: 3px solid transparent;
  }

  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
`;
const ButtonContainer = styled(Block)`
  position: relative;

  ${({ overlay }) =>
    overlay
      ? `::after {
      display: block;
      content: '';
      width: 16px;
      position: absolute;
      left: -16px;
      top: 0;
      bottom: 0;
      background-image: linear-gradient(to right, rgba(var(--context-fill-color-rgb), 0), rgba(var(--context-fill-color-rgb), 1));
    }`
      : ''}
`;

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

    notification.success(`${codeTitle} is copied`);
  }

  const multiline = (code || '').includes('\n') && !nowrap;
  const formattedCode = code
    .split(/\n/g)
    .map((line) => `${prefix || ''}${line} `)
    .join('\n');

  styles = {
    preset: 'default',
    ...styles,
  };

  const Snippet = (
    <Card
      data-qa="CopySnippet"
      fill="#grey-light"
      radius="1r"
      border={0}
      padding={0}
      style={{ position: 'relative' }}
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
          nowrap={nowrap}
          multiline={multiline}
          showScroll={showScroll}
          serif={serif}
          padding={padding}
        >
          <PrismCode
            style={{ margin: 0, overflow: 'visible' }}
            code={formattedCode}
            language={language || 'javascript'}
          />
        </StyledBlock>
        <ButtonContainer padding={padding} overlay={showOverlay} />
        <Button
          aria-label={`Copy ${codeTitle}`}
          type="clear"
          styles={{
            padding: '1x 1.5x',
            fontWeight: 500,
            radius: multiline || showScroll ? '0 1r' : '0 1r 1r 0',
            border: '#clear',
            outline: {
              '': '#purple-03.0',
              'focused & focus-visible': '#purple-03 inset',
            },
          }}
          style={POSITION_ACTION}
          onPress={onCopy}
        >
          <CopyOutlined />
        </Button>
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
