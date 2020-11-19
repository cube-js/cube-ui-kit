import styled from 'styled-components';
import './antd.less';
import {
  Input as AntdInput,
  Button as AntdButton,
} from 'antd';

export const Input = styled(AntdInput)`
  &&& {
    line-height: var(--input-line-height);
    font-size: var(--input-font-size);
    padding: 8px;
    border: var(--border-width) solid var(--border-color);
    
    &:-webkit-autofill {
      &, &:hover, &:focus {
        caret-color: var(--purple-color);
        -webkit-text-fill-color: var(--text-color);
        box-shadow: 0 0 0 9999rem rgba(var(--purple-color-rgb), .1) inset, 0 0 0 9999rem var(--white-color) inset;
        background-color: transparent;
        font-family: inherit;
        line-height: var(--input-line-height);
        font-size: var(--input-font-size);
      }
    }
  }
`;

export const Button = styled(AntdButton)`
  &&& {
    line-height: var(--line-height);
    font-size: var(--font-size);
    padding: 8px 16px;
    height: auto;
  }
`;

export * from 'antd';
