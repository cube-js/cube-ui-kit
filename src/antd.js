import styled from 'styled-components';
import './antd.less';
import {
  Input as AntdInput,
  InputNumber as AntdInputNumber,
  Button as AntdButton,
  AutoComplete as AntdAutoComplete,
  Table as AntdTable,
  Form,
  Tabs as AntdTabs,
  Select as AntdSelect,
  Breadcrumb,
} from 'antd';

const inputStyles = ` {
    line-height: var(--input-line-height);
    font-size: var(--input-font-size);
    letter-spacing: var(--input-letter-spacing);
    padding: 9px 12px;
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
        letter-spacing: var(--input-letter-spacing);
      }
    }
  }
`;

export const Input = styled(AntdInput)`
  &&&.ant-input ${inputStyles}
`;

export const InputNumber = styled(AntdInputNumber)`
  &&&.ant-input ${inputStyles}
`;

Input.TextArea = styled(AntdInput.TextArea)`
  &&&.ant-input ${inputStyles} &&&.ant-input {
    overflow: auto;
  }
`;

export const AutoComplete = styled(AntdAutoComplete)`
  &&.ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
    height: auto;
  }

  &&.ant-select:not(.ant-select-customize-input) .ant-select-selector {
    border: var(--border-width) solid var(--border-color);
    padding: 4px 12px;
  }

  &&.ant-select:not(.ant-select-customize-input)
    .ant-select-selector
    .ant-select-selection-search-input {
    height: auto;
    line-height: var(--input-line-height);
    font-size: var(--input-font-size);
    letter-spacing: var(--input-letter-spacing);
    padding: 9px 0;
  }
`;

export const Select = styled(AntdSelect)`
  &&.ant-select .ant-select-selection-item {
    line-height: var(--input-line-height);
    font-size: var(--input-font-size);
    letter-spacing: var(--input-letter-spacing);
  }
`;

export const Button = styled(AntdButton)`
  &&&.ant-btn {
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
  &&& .ant-table {
    table > thead > tr > th {
      background: transparent;
      font-size: var(--font-size);
      line-height: var(--line-height);
      font-weight: 400;
      color: rgba(var(--dark-color-rgb), 0.5);
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
  &&.ant-form-item {
    .ant-form-item-label-left > label {
      line-height: 40px;
    }

    .ant-form-item-explain-success > [role='alert'] {
      color: var(--success-color);
    }
  }
`;

export const Tabs = styled(AntdTabs)`
  .ant-tabs-tab-btn,
  .ant-tabs-tab-remove {
    font-weight: 500;
  }
`;

Breadcrumb.Item = styled(Breadcrumb.Item)`
  & a:hover {
    color: var(--purple-color);
  }
`;

Tabs.TabPane = AntdTabs.TabPane;

export * from 'antd';
