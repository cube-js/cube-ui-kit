import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

import { compileReact } from './scripts/compiler/transform.mjs';

export default defineConfig({
  test: {
    projects: [false, true].map((compiled) => ({
      resolve: {
        alias: {
          '@cube-dev/ui-kit': resolve(
            process.env.UIKIT_TEST_UNCOMPILED === '1'
              ? 'dist-uncompiled/index.js'
              : '.cache/compiler-package/package/dist/index.js',
          ),
        },
      },
      oxc: { jsx: { runtime: 'automatic' } },
      plugins: compiled
        ? [
            {
              name: 'compile-package-consumer',
              enforce: 'pre' as const,
              transform(source, id) {
                if (!id.endsWith('/package-tests/consumer.tsx')) return;
                const { report, ...result } = compileReact(source, id);
                if (
                  Object.keys(report.diagnostics).length ||
                  ![
                    'ModernConsumer',
                    'ImplicitConsumer',
                    'DialogConsumer',
                    'ControlledConsumer',
                  ].every((name) => report.compiled.includes(name)) ||
                  !result.code.includes('react-compiler-runtime')
                ) {
                  throw new Error(
                    'Package consumer must actually compile without diagnostics.',
                  );
                }
                return result;
              },
            },
          ]
        : [],
      test: {
        name: compiled ? 'compiled consumer' : 'uncompiled consumer',
        environment: 'jsdom',
        globals: true,
        include: ['package-tests/**/*.test.tsx'],
        setupFiles: ['package-tests/setup.ts'],
        maxWorkers: 2,
      },
    })),
  },
});
