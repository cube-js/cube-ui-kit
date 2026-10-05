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

// The reference has one scalar fill and no state conditions. Checking both
// background layers catches a wrong tint even when the opaque base is right.
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
