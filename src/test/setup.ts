import '@testing-library/jest-dom';
import 'jest-styled-components';

import { configure } from '@testing-library/react';
import { AbortController } from 'node-abort-controller';
import { config } from 'react-transition-group';

// @ts-expect-error Setup AbortController for test environment
global.AbortController = AbortController;
config.disabled = true;

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 10000 });
