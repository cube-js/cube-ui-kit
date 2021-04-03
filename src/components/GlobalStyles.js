import { createGlobalStyle } from 'styled-components';
import VARIABLES from '../css-properties';

const CSS_PROPERTIES = {};

Object.keys(VARIABLES).forEach((key) => {
  CSS_PROPERTIES[`--${key}`] = VARIABLES[key];
});

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

const GlobalStyles = createGlobalStyle`
  body {
    ${Object.entries(CSS_PROPERTIES)
      .map(([key, value]) => {
        return `${key}: ${value};`;
      })
      .join('\n    ')}
  }
  
  html {
    --font: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    --monospace-font: Menlo, Monaco, Consolas, 'Courier New', monospace;
  }
  
  body {
    background-color: white !important;
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    padding: 0;
    color: var(--dark-75-color);
    font-size: var(--medium-font-size);
    line-height: var(--medium-line-height);
    letter-spacing: var(--medium-letter-spacing);
    font-weight: 400;
  }
  
  .cube-notification-container {
    min-width: 288px;
    max-width: 340px;
    width: calc(100vw - 32px);
    position: fixed;
    top: 32px;
    right: 16px;
    z-index: 999999;
  }
  
  .cube-notifications {
    display: grid;
    grid-auto-flow: row;
    grid-template-columns: 1fr;
  }
  
  .cube-notification-enter {
    opacity: 0;
    max-height: 0px;
    margin-bottom: 0px;
    transform: translate(100%, 0);
  }
  
  .cube-notification-enter-active {
    opacity: 1;
    max-height: 56px;
    margin-bottom: 8px;
    transform: translate(0, 0);
    transition: all 300ms ease-in;
    
    & > * {
      margin-bottom: 0px;
    } 
  }
  
  .cube-notification-exit {
    opacity: 1;
    margin-bottom: 8px;
    max-height: 56px;
    transform: translate(0, 0);
  }
  
  .cube-notification-exit-active {
    opacity: 0;
    max-height: 0px;
    margin-bottom: 0px;
    transform: translate(100%, 0);
    transition: all 300ms ease-in;
    
    & > * {
      margin-bottom: 0px;
    }
  }
  
  b {
    font-weight: 600;
  }
  
  [type=reset], [type=submit], button, html [type=button] {
    -webkit-appearance: none;
  }
  
  code {
    font-family: var(--monospace-font);
  }
  
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/Inter-Regular.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/Inter-Regular.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/Inter-Medium.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/Inter-Medium.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/Inter-SemiBold.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/Inter-SemiBold.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/Inter-Bold.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/Inter-Bold.woff) format('woff');
  }
  @font-face {
    font-family: 'Source Code Pro';
    src: url('${({ publicUrl }) =>
      publicUrl || ''}/fonts/SourceCodePro-Regular.woff2') format('woff2'),
      url('${({ publicUrl }) =>
        publicUrl || ''}/fonts/SourceCodePro-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/JetBrainsMono-Regular.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/JetBrainsMono-Regular.woff) format('woff');
  }
  
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/JetBrainsMono-Bold.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/JetBrainsMono-Bold.woff) format('woff');
  }
  
  .ant-form-item-label>label {
    display: block;
    font-weight: 500;
  }

  .ant-modal-content {
    border-radius: 8px;
  }
  
  .ant-modal-header {
    border-radius: 8px 8px 0 0;
    padding: 16px 24px;
  }
  
  .ant-modal-body {
    padding: 24px;
  }
  
  .ant-modal-footer {
    padding: 12px 24px;
  }
  
  .ant-input.ant-input.ant-input.ant-input ${inputStyles}
  .ant-input-affix-wrapper .ant-input.ant-input.ant-input.ant-input {
    border: none;
  } 
  textarea.ant-input.ant-input.ant-input.ant-input { overflow: auto; }
  
  .ant-select {
    overflow: hidden;
    
    &&.ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
      height: auto;
    }
    
    &&&& .ant-select-selector {
      height: 40px;
    }
    
    && .ant-select-selection-item::after {
      display: none;
    }
    
    && .ant-select-selector::after {
      display: none;
    }
  
    &&&&&:not(.ant-select-customize-input):not(.ant-select-show-search) .ant-select-selector {
      border: var(--border-width) solid var(--border-color);
      padding: 5px 12px;
    }
  
    &&:not(.ant-select-customize-input)
      .ant-select-selector
      .ant-select-selection-search-input {
      height: auto;
      line-height: var(--input-line-height);
      font-size: var(--input-font-size);
      letter-spacing: var(--input-letter-spacing);
      padding: 0;
    }
    
    &&.ant-select-auto-complete .ant-select-selection-search {
      padding: 8px 0;
    }
  }

  .ant-select.ant-select-single {
    && .ant-select-selection-item {
      line-height: var(--input-line-height);
      font-size: var(--input-font-size);
      letter-spacing: var(--input-letter-spacing);
    }
    
    &&.ant-select-show-search {
      & .ant-select-selection-item {
        padding: 8px 0;
      }
      
      & .ant-select-selection-search {
        padding: 8px 0;
      }
    }
    
    &&:not(.ant-select-show-search) .ant-select-selection-item {
      padding: 3px 0;
    }
  }
  
  .ant-btn {
    &&& {
      line-height: var(--line-height);
      font-size: var(--font-size);
      padding: 9px 16px;
      height: 40px;
      box-shadow: none;
  
      &:not(.ant-btn-primary):not(.ant-btn-dangerous):hover {
        background-color: rgba(var(--purple-color-rgb), 0.05);
        color: var(--purple-color);
      }
  
      &.ant-btn-icon-only {
        padding: 8px;
        width: auto;
      }
    }
  }
  
  .ant-table {
    &&& {
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
  }
  
  .ant-form-item {
    && {
      .ant-form-item-label-left > label {
        line-height: 40px;
      }
  
      .ant-form-item-explain-success > [role='alert'] {
        color: var(--success-color);
      }
    }
  }
  
  .ant-tabs {
    .ant-tabs-tab-btn,
    .ant-tabs-tab-remove {
      font-weight: 500;
    }
  }
  
  .ant-breadcrumb {
    && a:hover {
      color: var(--purple-color);
    }
  }
  
  .ant-page-header-heading {
    align-items: center;
  }
  
  .ant-page-header-heading-sub-title {
    color: var(--dark-65-color);
  }
  
  .ant-page-header-back-button.ant-page-header-back-button {
    font-size: 24px;
    color: var(--dark-75-color);
  }
  
  .ant-modal-title.ant-modal-title {
    font-weight: 600;
  }
  
  // Prism Code
  code[class*="language-"],
  pre[class*="language-"] {
    color: var(--dark-color);
    background: none;
    font-family: "Source Code Pro", Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    text-align: left;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    border-radius: 4px;
    border: none;
  
    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;
  
    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
  }
  
  pre[class*="language-"]::-moz-selection, pre[class*="language-"] ::-moz-selection,
  code[class*="language-"]::-moz-selection, code[class*="language-"] ::-moz-selection {
    text-shadow: none;
    /*background: #b3d4fc;*/
  }
  
  pre[class*="language-"]::selection, pre[class*="language-"] ::selection,
  code[class*="language-"]::selection, code[class*="language-"] ::selection {
    text-shadow: none;
    /*background: #b3d4fc;*/
  }
  
  @media print {
    code[class*="language-"],
    pre[class*="language-"] {
      text-shadow: none;
    }
  }
  
  /* Code blocks */
  pre[class*="language-"] {
    overflow: auto;
  }
  
  :not(pre) > code[class*="language-"],
  pre[class*="language-"] {
    background: transparent;
  }
  
  /* Inline code */
  :not(pre) > code[class*="language-"] {
    border-radius: .3em;
    white-space: normal;
  }
  
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: var(--dark-04-color);
  }
  
  .token.keyword,
  .token.tag,
  .token.operator,
  .token.punctuation {
    color: #993388;
  }
  
  .namespace {
    opacity: .7;
  }
  
  .token.property,
  .token.boolean,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: var(--pink-color);
  }
  
  .token.entity,
  .token.number {
    color: #30A666;
  }
  
  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin,
  .token.inserted {
    color: var(--purple-text-color);
  }
  
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: var(--dark-color);
  }
  
  .token.atrule,
  .token.attr-value {
    color: var(--dark-color);
  }
  
  .token.atrule,
  .token.keyword {
    font-weight: 500;
  }
  
  .token.function,
  .token.class-name {
    color: var(--pink-color);
  }
  
  .token.regex,
  .token.important,
  .token.variable {
    color: var(--pink-color);
  }
  
  .token.important,
  .token.bold {
    font-weight: bold;
  }
  
  .token.italic {
    font-style: italic;
  }
  
  .token.entity {
    cursor: help;
  }
`;

export default GlobalStyles;
