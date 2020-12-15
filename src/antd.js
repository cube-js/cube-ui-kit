import styled from 'styled-components';
import './antd.less';
import {
  Input as AntdInput,
  InputNumber as AntdInputNumber,
  Button as AntdButton,
  AutoComplete as AntdAutoComplete,
  Table as AntdTable,
  Form,
} from 'antd';

const inputStyles = ` {
    line-height: var(--input-line-height);
    font-size: var(--input-font-size);
    padding: 10px 12px;
    border: var(--border-width) solid var(--border-color);

    &:-webkit-autofill {
      &,
      &:hover,
      &:focus {
        caret-color: var(--purple-color);
        -webkit-text-fill-color: var(--text-color);
        box-shadow: 0 0 0 9999rem rgba(var(--purple-color-rgb), 0.1) inset,
          0 0 0 9999rem var(--white-color) inset;
        background-color: transparent;
        font-family: inherit;
        line-height: var(--input-line-height);
        font-size: var(--input-font-size);
      }
    }
  }
`;

export const Input = styled(AntdInput)`
  &&& ${inputStyles}
`;

export const InputNumber = styled(AntdInputNumber)`
  &&& ${inputStyles}
`;

Input.TextArea = styled(AntdInput.TextArea)`
  &&& ${inputStyles} &&& {
    overflow: auto;
  }
`;

export const AutoComplete = styled(AntdAutoComplete)`
  &&.ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
    height: auto;
  }

  &&.ant-select:not(.ant-select-customize-input) .ant-select-selector {
    border: var(--border-width) solid var(--border-color);
    padding: 3px 12px;
  }

  &&.ant-select:not(.ant-select-customize-input)
    .ant-select-selector
    .ant-select-selection-search-input {
    height: auto;
    line-height: var(--input-line-height);
    font-size: var(--input-font-size);
    padding: 8px 0;
  }
`;

export const Button = styled(AntdButton)`
  &&& {
    line-height: var(--line-height);
    font-size: var(--font-size);
    padding: 8px 16px;
    height: auto;
    box-shadow: none;

    &:not(.ant-btn-primary):not(.ant-btn-dangerous):hover {
      background-color: rgba(var(--purple-color-rgb), 0.05);
      color: var(--purple-color);
    }

    &.ant-btn-icon-only {
      padding: 8px;
      width: auto;
      height: auto;
    }
  }
`;

export const Table = styled(AntdTable)`
  &&& {
    & table > thead > tr > th {
      background: transparent;
      font-size: var(--font-size);
      line-height: var(--line-height);
      font-weight: 400;
      color: var(--dark-65-color);
    }

    .ant-table-tbody > tr.ant-table-row:hover > td {
      background: rgba(var(--purple-color-rgb), 0.05);
    }

    .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(var(--dark-color-rgb), 0.1);
    }
  }
`;

Form.Item = styled(Form.Item)`
  && {
    .ant-form-item-label-left > label {
      line-height: 40px;
    }
    
    .ant-form-item-explain-success > [role="alert"] {
      color: var(--success-color);
    }
  }
`;

export * from 'antd';
