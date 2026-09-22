import { transformSync } from '@babel/core';
import compiler from 'babel-plugin-react-compiler';
import { mergeConfig } from 'vitest/config';

import config from './vitest.form-react.config';

// Compile modern consumer fixtures as well as adapters. The release build
// separately compiles library source through scripts/compiler/transform.mjs.
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
          !id.endsWith('/Dialog/ModernDialogForm.tsx') &&
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
          /\/(submission|field|dialog)\.fixture\.tsx$/.test(id) &&
          !result?.code?.includes('react-compiler-runtime')
        )
          throw new Error(
            'Form consumer fixture did not compile: this gate must exercise compiled code.',
          );
        return { code: result?.code ?? source, map: result?.map };
      },
    },
  ],
});
