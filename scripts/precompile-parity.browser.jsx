import { destroy, getCSSText } from '@tenphi/tasty';
import { registerTastyPrecompiled } from '@tenphi/tasty/precompile/register';
import { cleanup, render } from '@testing-library/react';
import { afterAll, describe, expect, test } from 'vitest';

import manifest from '../dist/precompiled/manifest.js';
import css from '../dist/precompiled/styles.css?raw';
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

    const style = document.createElement('style');
    style.dataset.tastyPrecompiled = manifest.id;
    style.textContent = css;
    document.head.append(style);
    registerTastyPrecompiled(manifest);

    const precompiled = render(<Example marker="precompiled" />);
    await settle();

    const precompiledStyles = capture(precompiled.container);
    const precompiledCSS = getCSSText();
    const buttonClasses = precompiled.container
      .querySelector('[data-parity="button"]')
      .className.split(/\s+/);

    const placeholderAnimation = precompiledStyles.find(
      (item) => item.parity === 'placeholder',
    ).animationName;

    expect(precompiledStyles).toEqual(runtimeStyles);
    expect(precompiledCSS).toContain('--precompile-parity: precompiled');
    expect(precompiledCSS.length).toBeLessThan(runtimeCSS.length);
    expect(placeholderAnimation).toMatch(/^placeholder-sweep-[a-z0-9]+$/);
    expect(css).toContain(`@keyframes ${placeholderAnimation}`);
    expect(css).toMatch(/animation-name: refresh-sweep-[a-z0-9]+/);
    for (const className of buttonClasses) {
      expect(runtimeCSS).toContain(`.${className}`);
      expect(precompiledCSS).not.toContain(`.${className}`);
    }

    precompiled.unmount();
    style.remove();
  });
});

afterAll(() => {
  cleanup();
  destroy();
});
