import { registerTastyPrecompiled } from '@tenphi/tasty/precompile/register';
import { bench, describe } from 'vitest';

import manifest from '../dist/precompiled/manifest.js';
import css from '../dist/precompiled/styles.css?raw';

const parsed = new CSSStyleSheet();
parsed.replaceSync(css);
const rules = Array.from(parsed.cssRules, (rule) => rule.cssText);

const registrationStart = performance.now();
registerTastyPrecompiled(manifest);
const registrationDuration = performance.now() - registrationStart;

console.log(
  `Precompiled Tasty manifest registration: ${registrationDuration.toFixed(3)} ms (${manifest.chunks.length} chunks).`,
);

describe('UI Kit precompiled stylesheet startup', () => {
  bench('adopt an already parsed static stylesheet', () => {
    const previous = document.adoptedStyleSheets;
    document.adoptedStyleSheets = [...previous, parsed];
    document.adoptedStyleSheets = previous;
  });

  bench('assign one style.textContent block', () => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    style.remove();
  });

  bench('CSSStyleSheet.replaceSync', () => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
  });

  bench('CSSStyleSheet.insertRule loop', () => {
    const sheet = new CSSStyleSheet();
    for (const rule of rules) sheet.insertRule(rule, sheet.cssRules.length);
  });
});
