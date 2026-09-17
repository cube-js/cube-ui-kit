import { transformSync } from '@babel/core';
import compiler from 'babel-plugin-react-compiler';
import { mergeConfig } from 'vitest/config';

import config from './vitest.form-react.config';

// Test-only compilation: published library output remains uncompiled. Target
// React 18's runtime so this same gate runs in both React peer-version jobs.
export default mergeConfig(config, {
  plugins: [
    {
      name: 'compile-modern-form-contract',
      enforce: 'pre',
      transform(source, id) {
        if (
          id.includes('node_modules') ||
          id.includes('.test.') ||
          !/\.[jt]sx?$/.test(id)
        )
          return;
        if (
          !id.includes('/Form/modern/') &&
          !/\/Form\/(ModernFormRoot\.tsx|use-field\/use-field-(binding\.ts|props\.tsx))$/.test(
            id,
          )
        )
          return;
        const result = transformSync(source, {
          filename: id,
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ['typescript', 'jsx'] },
          plugins: [[compiler, { target: '18', panicThreshold: 'all_errors' }]],
          sourceMaps: true,
        });
        if (
          id.endsWith('/submission.fixture.tsx') &&
          !result?.code?.includes('react-compiler-runtime')
        )
          throw new Error(
            'Submission fixture did not compile: this gate must exercise compiled code.',
          );
        return { code: result?.code ?? source, map: result?.map };
      },
    },
  ],
});
