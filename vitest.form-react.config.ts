import { mergeConfig } from 'vitest/config';

import config from './vitest.config';

// Run the same adapter contract against the installed React version in CI.
export default mergeConfig(config, {
  test: {
    include: ['src/components/form/Form/modern/**/*.test.tsx'],
    maxWorkers: 2,
  },
});
