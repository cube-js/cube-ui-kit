import { tasty } from '@tenphi/tasty';
import { render } from '@testing-library/react';

import { Root } from '../components/Root';

import { ITEM_VARIANTS } from './item-themes';

const VARIANTS = [
  'default.outline',
  'default.outline-2',
  'default.clear',
  'danger.outline',
  'danger.outline-2',
  'danger.clear',
  'success.outline',
  'success.outline-2',
  'success.clear',
  'warning.outline',
  'warning.outline-2',
  'warning.clear',
  'note.outline',
  'note.outline-2',
  'note.clear',
  'special.outline',
  'special.clear',
] as const;

const STATES = Array.from({ length: 32 }, (_, bits) => ({
  selected: Boolean(bits & 1),
  hovered: Boolean(bits & 2),
  focused: Boolean(bits & 4),
  pressed: Boolean(bits & 8),
  disabled: Boolean(bits & 16),
}));

// The reference has one scalar fill and no state conditions. Every fill paints
// one `background-color`; reading the image too catches a value that still
// paints a second layer.
const Reference = tasty({ styles: { transition: 'none' } });

function background(element: Element) {
  const style = getComputedStyle(element);

  return [style.backgroundColor, style.backgroundImage];
}

describe('item theme fill priority', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-scheme');
    document.documentElement.removeAttribute('data-contrast');
  });

  it.each([
    ['light', 'normal'],
    ['dark', 'normal'],
    ['light', 'high'],
    ['dark', 'high'],
  ])(
    'preserves intersecting states in %s / %s contrast',
    (scheme, contrast) => {
      document.documentElement.setAttribute('data-scheme', scheme);
      document.documentElement.setAttribute('data-contrast', contrast);

      for (const variant of VARIANTS) {
        const fill = ITEM_VARIANTS[variant].fill as Record<string, string>;
        const Chip = tasty({ styles: { fill, transition: 'none' } });

        // This is the visual contract, independent of Tasty's selector compiler:
        // disabled preserves selection and suppresses transient interactions;
        // otherwise press beats hover/focus, which beats resting selection.
        const expectedFill = (state: (typeof STATES)[number]) => {
          if (state.disabled)
            return state.selected ? fill.selected : fill.disabled;
          if (state.selected && state.pressed)
            return fill['selected & pressed'];
          if (state.selected && (state.hovered || state.focused))
            return fill['selected & (hovered | focused)'];
          if (state.selected) return fill.selected;
          if (state.pressed) return fill.pressed;
          if (state.hovered) return fill.hovered ?? fill['hovered | focused'];
          if (state.focused && fill['hovered | focused'])
            return fill['hovered | focused'];

          return fill[''];
        };

        const view = render(
          <>
            {STATES.map((state, index) => (
              <div key={index}>
                <Chip qa={`actual-${index}`} mods={state} />
                <Reference
                  qa={`expected-${index}`}
                  styles={{ fill: expectedFill(state) }}
                />
              </div>
            ))}
          </>,
          { wrapper: Root },
        );

        for (const [index, state] of STATES.entries()) {
          expect(
            background(view.getByTestId(`actual-${index}`)),
            `${variant}: ${JSON.stringify(state)}`,
          ).toEqual(background(view.getByTestId(`expected-${index}`)));
        }

        view.unmount();
      }
    },
  );
});

/** The pixel a color paints over what the canvas already holds. */
function paint(context: CanvasRenderingContext2D, color: string) {
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);

  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}

function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;

    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast of an element's text against its fill over the surface. */
function labelContrast(element: Element) {
  const context = document.createElement('canvas').getContext('2d', {
    willReadFrequently: true,
  })!;

  paint(context, getComputedStyle(element.parentElement!).backgroundColor);

  const fill = paint(context, getComputedStyle(element).backgroundColor);
  const text = paint(context, getComputedStyle(element).color);
  const [light, dark] = [luminance(fill), luminance(text)].sort(
    (a, b) => b - a,
  );

  return (light + 0.05) / (dark + 0.05);
}

const Surface = tasty({ styles: { fill: '#surface' } });

// A selected label sits on a darker fill while it is hovered or keyboard
// focused, and has to stay readable there too. Axe photographs stories at
// rest, so only this check sees the focused state.
describe('item theme selected label contrast', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-scheme');
    document.documentElement.removeAttribute('data-contrast');
  });

  const SELECTED_STATES = [
    { selected: true },
    { selected: true, hovered: true },
    { selected: true, focused: true },
  ];

  it.each([
    ['light', 'normal'],
    ['dark', 'normal'],
    ['light', 'high'],
    ['dark', 'high'],
  ])(
    'keeps AA on every selected fill in %s / %s contrast',
    (scheme, contrast) => {
      document.documentElement.setAttribute('data-scheme', scheme);
      document.documentElement.setAttribute('data-contrast', contrast);

      for (const variant of VARIANTS.filter(
        (name) => !name.startsWith('special'),
      )) {
        const { fill, color } = ITEM_VARIANTS[variant];
        const Chip = tasty({ styles: { fill, color, transition: 'none' } });

        const view = render(
          <>
            {SELECTED_STATES.map((state, index) => (
              <Surface key={index}>
                <Chip qa={`chip-${index}`} mods={state}>
                  Label
                </Chip>
              </Surface>
            ))}
          </>,
          { wrapper: Root },
        );

        for (const [index, state] of SELECTED_STATES.entries()) {
          expect(
            labelContrast(view.getByTestId(`chip-${index}`)),
            `${variant}: ${JSON.stringify(state)}`,
          ).toBeGreaterThanOrEqual(4.5);
        }

        view.unmount();
      }
    },
  );
});
