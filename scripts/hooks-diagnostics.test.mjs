import { ESLint } from 'eslint';

import { strictHooksConfig } from '../eslint.hooks.config.mjs';

import {
  aggregate,
  checkBaseline,
  isFormFile,
  regressions,
  validateScan,
} from './hooks-diagnostics.mjs';
import { usesEffectEvent } from './hooks-policy.mjs';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: strictHooksConfig,
  allowInlineConfig: false,
});
const lint = async (source) =>
  (
    await eslint.lintText(source, {
      filePath: 'src/effect-event-policy-check.tsx',
    })
  )[0].messages;
const component = (body) => `
  import { useEffect, useEffectEvent } from 'react';
  function Panel({ value, subscribe }) {
    const onEvent = useEffectEvent(() => value());
    ${body}
  }
`;

it('accepts a local effect-owned listener with reactive resource configuration', async () => {
  expect(
    await lint(
      component(
        'useEffect(() => subscribe(onEvent), [subscribe]); return null;',
      ),
    ),
  ).toEqual([]);
});

it.each([
  'onEvent(); return null;',
  'return <button onClick={onEvent} />;',
  'return <Child onDone={onEvent} />;',
  'useListener(onEvent); return null;',
  'return onEvent;',
  'useEffect(() => onEvent(), [onEvent]); return null;',
  'useEffect(() => subscribe(onEvent), []); return null;',
  '// eslint-disable-next-line react-hooks/rules-of-hooks\n onEvent(); return null;',
])('rejects Effect Event misuse: %s', async (body) => {
  expect(
    (await lint(component(body))).some((message) => message.severity === 2),
  ).toBe(true);
});

it.each([
  "import { useEffectEvent as useEvent } from 'react';",
  "import * as React from 'react'; const hook = React.useEffectEvent;",
  "import React from 'react'; const hook = React['useEffectEvent'];",
  "import React from 'react'; const { useEffectEvent: hook } = React;",
  "import { useEffectEvent } from './wrapper';",
  "import { useEffectEvent } from 'react'; const hook = useEffectEvent;",
  "export { useEffectEvent } from 'react';",
])(
  'rejects hook forms the official plugin cannot track: %s',
  async (source) => {
    expect(usesEffectEvent(source)).toBe(true);
    expect(
      (await lint(source)).some(
        (message) => message.ruleId === 'uikit/effect-event-imports',
      ),
    ).toBe(true);
  },
);

it('does not select comments for the strict pass', () => {
  expect(usesEffectEvent('// useEffectEvent\nexport const value = 1;')).toBe(
    false,
  );
});

it('allows existing debt to decrease and rejects findings added to any file/rule', () => {
  const baseline = aggregate([{ file: 'src/a.tsx', rule: 'react-hooks/refs' }]);
  expect(regressions(baseline, baseline)).toEqual([]);
  expect(regressions(aggregate([]), baseline)).toEqual([]);
  expect(
    regressions(
      aggregate([
        { file: 'src/a.tsx', rule: 'react-hooks/refs' },
        { file: 'src/a.tsx', rule: 'react-hooks/refs' },
      ]),
      baseline,
    ),
  ).toHaveLength(1);
  expect(
    regressions(
      aggregate([{ file: 'src/b.tsx', rule: 'react-hooks/refs' }]),
      baseline,
    ),
  ).toHaveLength(1);
});

it('rejects a missing baseline', () => {
  expect(() => checkBaseline(aggregate([]), undefined)).toThrow(
    'Missing Hooks baseline',
  );
});

it('rejects empty, ignored, fatal and unknown-rule scans', () => {
  expect(() => validateScan([])).toThrow('empty');
  for (const message of [
    { ruleId: null, message: 'ignored' },
    { fatal: true, message: 'parse error' },
    { severity: 2, ruleId: 'react-hooks/unknown', message: 'unknown rule' },
  ])
    expect(() =>
      validateScan([{ filePath: 'src/a.tsx', messages: [message] }]),
    ).toThrow(message.message);
});

it('keeps Form checks as a view over the whole-source scope', () => {
  expect(isFormFile('src/components/form/Form/modern/react.tsx')).toBe(true);
  expect(isFormFile('src/components/fields/TextInput/TextInput.tsx')).toBe(
    true,
  );
  expect(
    isFormFile('src/components/overlays/Dialog/ModernDialogForm.tsx'),
  ).toBe(true);
  expect(isFormFile('src/shared/form.ts')).toBe(true);
  expect(isFormFile('src/components/overlays/Dialog/Dialog.tsx')).toBe(false);
});
