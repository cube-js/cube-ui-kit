import { createGlobalStyle } from 'styled-components';
import VARIABLES from '../css-properties';

const CSS_PROPERTIES = {};

Object.keys(VARIABLES).forEach((key) => {
  CSS_PROPERTIES[`--${key}`] = VARIABLES[key];
});

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
    --monospace-font: 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace;
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
  }
  
  .ant-modal-body {
    padding: 24px 20px;
  }
  
  .ant-modal-footer {
    padding: 12px 20px;
  }
`;

export default GlobalStyles;
