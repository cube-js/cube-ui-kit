import { createGlobalStyle } from 'styled-components';
import VARIABLES from '../css-properties';

const CSS_PROPERTIES = {};

Object.keys(VARIABLES).forEach((key) => {
  CSS_PROPERTIES[`--${key}`] = VARIABLES[key];
});

const CSSCustomProperties = createGlobalStyle`
  body {
    ${Object.entries(CSS_PROPERTIES)
      .map(([key, value]) => {
        return `${key}: ${value};`;
      })
      .join('\n    ')}
  }
  
  body {
    background-color: white !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
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
    font-display: swap;
    src: url(/fonts/Inter-Regular.woff2);
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url(/fonts/Inter-Medium.woff2);
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url(/fonts/Inter-SemiBold.woff2);
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(/fonts/Inter-Bold.woff2);
  }
  @font-face {
    font-family: "Source Code Pro";
    src: url('/fonts/SourceCodePro-Regular.woff2') format('woff2'),
      url('/fonts/SourceCodePro-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }
  
  .ant-form-item-label>label {
    display: block;
    font-weight: 500;
  }
`;

export default CSSCustomProperties;
