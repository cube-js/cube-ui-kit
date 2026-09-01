import css from '@cube-dev/ui-kit/precompiled-styles.css?raw';
import manifest from '@cube-dev/ui-kit/precompiled-styles/manifest';
import { destroy, getCSSText, tastyDebug } from '@tenphi/tasty';
import { cleanup, render } from '@testing-library/react';
import { afterAll, describe, expect, test } from 'vitest';

import { Button, Checkbox, Placeholder, Root, TextInput } from '../src/index';

function Example({ marker }) {
  return (
    <Root fonts={false} bodyStyles={{ '--precompile-parity': marker }}>
      <Button data-parity="button" theme="danger">
        Delete
      </Button>
      <TextInput data-parity="input" label="Name" defaultValue="Ada" />
      <Checkbox data-parity="checkbox" defaultSelected>
        Enabled
      </Checkbox>
      <Placeholder data-parity="placeholder" />
    </Root>
  );
}

function capture(container) {
  return Array.from(container.querySelectorAll('[class]'), (element) => {
    const computed = getComputedStyle(element);

    return {
      tag: element.tagName,
      qa: element.getAttribute('data-qa'),
      parity: element.getAttribute('data-parity'),
      className: element.className,
      display: computed.display,
      position: computed.position,
      height: computed.height,
      padding: computed.padding,
      borderRadius: computed.borderRadius,
      animationName: computed.animationName,
    };
  });
}

async function settle() {
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('UI Kit precompiled Tasty artifact', () => {
  test('matches runtime computed styles while keeping globals dynamic', async () => {
    const runtime = render(<Example marker="runtime" />);
    await settle();

    const runtimeStyles = capture(runtime.container);
    const runtimeCSS = getCSSText();

    runtime.unmount();
    destroy();

    await import('@cube-dev/ui-kit/precompiled-styles');

    const precompiled = render(<Example marker="precompiled" />);
    await settle();

    const precompiledStyles = capture(precompiled.container);
    const precompiledCSS = getCSSText();
    const debugSummary = tastyDebug.summary({ raw: true });
    const buttonClasses = precompiled.container
      .querySelector('[data-parity="button"]')
      .className.split(/\s+/);

    const placeholderAnimation = precompiledStyles.find(
      (item) => item.parity === 'placeholder',
    ).animationName;

    expect(precompiledStyles).toEqual(runtimeStyles);
    expect(precompiledCSS).toContain('--precompile-parity: precompiled');
    expect(precompiledCSS.length).toBeLessThan(runtimeCSS.length);
    expect(debugSummary.precompiledCSSSize).toBe(css.length);
    expect(debugSummary.precompiledRuleCount).toBe(manifest.stats.ruleCount);
    expect(placeholderAnimation).toMatch(/^placeholder-sweep-[a-z0-9]+$/);
    expect(css).toContain(`@keyframes ${placeholderAnimation}`);
    expect(css).toMatch(
      /animation: refresh-sweep-[a-z0-9]+ 1\.4s linear infinite/,
    );
    for (const className of buttonClasses) {
      expect(runtimeCSS).toContain(`.${className}`);
      expect(precompiledCSS).not.toContain(`.${className}`);
    }

    precompiled.unmount();
  });
});

afterAll(() => {
  cleanup();
  destroy();
});
