import { forwardRef } from 'react';
import isPropValid from '@emotion/is-prop-valid';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { configure } from '@testing-library/react';
import { config } from 'react-transition-group';
import { AbortController } from 'node-abort-controller';

global.AbortController = AbortController;
config.disabled = true;
process.setMaxListeners(Infinity);

jest.mock('styled-components', () => {
  const mock = (Component) => () => {
    const component = forwardRef((props: any, ref) => (
      <Component ref={ref} {...props} />
    ));

    component.displayName = Component.displayName;

    return component;
  };

  const mockProxy = new Proxy(mock, {
    get: (_, prop) => {
      const mocked = () => {
        const component = forwardRef((props: any, ref) => {
          const Type = props.as ?? String(prop) ?? 'div';
          const propsWithRef = { ...props, ref };

          for (const key of Object.keys(propsWithRef)) {
            if (!isPropValid(key)) {
              delete propsWithRef[key];
            }
          }

          return <Type ref={ref} {...propsWithRef} />;
        });

        component.displayName = `mock(styled.${String(prop)})`;

        return component;
      };

      Object.defineProperty(mocked, 'attrs', {
        value: (...args) => {
          console.log('attrs');

          return mocked;
        },
      });

      return mocked;
    },
  });

  return {
    __esModule: true,
    default: mockProxy,
    createGlobalStyle: () => jest.fn(({ children }) => <>{children}</>),
    StyleSheetManager: jest.fn(({ children }) => <>{children}</>),
  };
});

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 10000 });
