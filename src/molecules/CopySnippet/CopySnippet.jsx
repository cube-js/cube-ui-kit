import React from 'react';
import copy from 'clipboard-copy';
import Block from '../../components/Block';
import Button from '../../atoms/Button/Button';
import Card from '../../atoms/Card/Card';
import Grid from '../../components/Grid';
import notification from '../../services/notification';
import { CopyOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import PrismCode from '../../atoms/PrismCode/PrismCode';

const POSITION_ACTION = {
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

export default function CopySnippet({
  code,
  title,
  nowrap,
  prefix,
  language,
  scroll,
  serif,
  children,
  padding,
  overlay,
  ...props
}) {
  padding = padding || '1.125x 1.5x';

  const codeTitle = title || 'Code example';

  async function onCopy() {
    await copy(code);

    notification.success(`${codeTitle} is copied`);
  }

  const multiline = (code || '').includes('\n') && !nowrap;
  const showScroll = scroll !== false;
  const showOverlay = overlay !== false;

  return (
    <Card
      data-qa="CopySnippet"
      fill="#grey-light"
      radius="1r"
      border={0}
      padding={0}
      style={{ position: 'relative' }}
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
            code={code
              .split(/\n/g)
              .map((line) => `${prefix || ''}${line} `)
              .join('\n')}
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
}
