import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import 'jest-styled-components';
import { configure } from '@testing-library/react';
import { config } from 'react-transition-group';
import { AbortController } from 'node-abort-controller';
import React from 'react';

global.AbortController = AbortController;
config.disabled = true;

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 10000 });