import { describe, expect, it } from 'vitest';

import { checkReport, compileReact } from './transform.mjs';

const filename = '/consumer/Counter.tsx';

describe('React Compiler coverage gate', () => {
  it('emits the React 18 runtime for a compiled component', () => {
    const result = compileReact(
      `
      import { useState } from 'react';
      export function Counter() {
        const [count, setCount] = useState(0);
        return <button onClick={() => setCount(count + 1)}>{count}</button>;
      }
    `,
      filename,
    );
    expect(result.code).toContain('react-compiler-runtime');
    expect(result.report.compiled).toContain('Counter');
    expect(result.report.diagnostics).toEqual({});
  });

  it('rejects a newly introduced render-time ref read instead of silently bailing out', () => {
    const { report } = compileReact(
      `
      import { useRef } from 'react';
      export function Counter() {
        const value = useRef(0);
        return <span>{value.current}</span>;
      }
    `,
      filename,
    );
    expect(() => checkReport(filename, report, {})).toThrow(
      'new Refs diagnostic',
    );
    expect(report.details[0].reason).toContain('refs during render');
  });

  it('requires review when an optimized component opts out', () => {
    const { report } = compileReact(
      `
      export function Counter() {
        'use no memo';
        return <span>Uncompiled</span>;
      }
    `,
      filename,
    );
    expect(() =>
      checkReport(filename, report, {
        [filename]: { compiled: 1, diagnostics: {}, optOuts: 0 },
      }),
    ).toThrow('coverage decreased');
  });
});
