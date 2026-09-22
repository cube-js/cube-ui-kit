import { mergeConfig } from 'vitest/config';

import { reactCompilerPlugin } from './scripts/compiler/transform.mjs';
import config from './vitest.config';

// Run the full behavioral suite through the exact release transform. Tests and
// their helpers remain uncompiled, as they would in an uncompiled consumer.
export default mergeConfig(config, { plugins: [reactCompilerPlugin()] });
