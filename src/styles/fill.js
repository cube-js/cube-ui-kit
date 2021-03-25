import { createRule, parseStyle } from '../utils/styles';

export default function bgStyle({ fill }) {
  if (!fill) return '';

  if (fill.startsWith('#')) {
    fill = parseStyle(fill).color || fill;
  }

  const match = fill.match(/var\(--(.+?)-color/);
  let name = '';

  if (match) {
    name = match[1];
  }

  return [createRule('background-color', fill)]
    .concat(
      name
        ? [
            createRule(`--context-fill-color`, `var(--${name}-color)`, '>*'),
            createRule(
              `--context-fill-color-rgb`,
              `var(--${name}-color-rgb)`,
              '>*',
            ),
          ]
        : [],
    )
    .join();
}

bgStyle.__styleLookup = ['fill'];
