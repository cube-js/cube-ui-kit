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
  
  body {
    background-color: white !important;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    padding: 0;
  }
  
  code {
    font-family: 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace;
  }
  
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/Inter-Regular.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/Inter-Regular.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/Inter-Medium.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/Inter-Medium.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    src: url(${({ publicUrl }) =>
      publicUrl || ''}/fonts/Inter-SemiBold.woff2) format('woff2'),
      url(${({ publicUrl }) =>
        publicUrl || ''}/fonts/Inter-SemiBold.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
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
  }
  
  .ant-form-item-label>label {
    display: block;
    font-weight: 500;
  }
`;

export default GlobalStyles;
