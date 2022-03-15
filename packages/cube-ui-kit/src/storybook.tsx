import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Root } from './index';

ReactDOM.render(
  <StrictMode>
    <Root>
      <App />
    </Root>
  </StrictMode>,
  document.getElementById('root'),
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta?.hot) {
  import.meta.hot.accept();
}
