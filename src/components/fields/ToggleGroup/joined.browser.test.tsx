import { userEvent } from 'vitest/browser';

import { renderWithRoot, screen } from '../../../test';
import { Radio } from '../RadioGroup/Radio';

import { ToggleGroup } from './ToggleGroup';

/**
 * `Radio.Group type="button"` and `ToggleGroup` are one joined row of buttons
 * with two semantics: a radio group for exactly one option, toggle buttons for
 * one or none, or several. Both take their look from
 * `RadioGroup/joined-styles.ts`, and these specs render them side by side and
 * fail as soon as a computed style parts. Radio is the reference, so a
 * difference is a bug in whichever one moved.
 *
 * Focus is left out of the comparison on purpose: a radio group rings the whole
 * group, while a toggle draws its own ring, because the arrow keys move focus
 * between toggles without selecting.
 */

type Look = Record<string, string>;

function buttonLook(button: HTMLElement): Look {
  let style = getComputedStyle(button);
  let label = button.querySelector<HTMLElement>('[data-element="Label"]');

  return {
    fill: style.backgroundColor,
    color: label ? getComputedStyle(label).color : style.color,
    border: `${style.borderTopColor} ${style.borderRightColor} ${style.borderBottomColor} ${style.borderLeftColor}`,
    radius: `${style.borderTopLeftRadius} ${style.borderTopRightRadius} ${style.borderBottomRightRadius} ${style.borderBottomLeftRadius}`,
    margin: style.marginLeft,
    zIndex: style.zIndex,
    font: `${style.fontSize} / ${style.lineHeight} ${style.fontWeight}`,
    size: `${button.getBoundingClientRect().width}x${button.getBoundingClientRect().height}`,
  };
}

function groupLook(group: HTMLElement): Look {
  let style = getComputedStyle(group);

  return { gap: style.columnGap, isolation: style.isolation };
}

/** Lets hover and selection transitions finish before anything is read. */
async function settle() {
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished),
  );
}

function renderBoth({
  size,
  isDisabled = false,
}: {
  size: 'small' | 'medium';
  isDisabled?: boolean;
}) {
  renderWithRoot(
    <>
      <Radio.ButtonGroup
        aria-label="Align"
        qa="Radios"
        size={size}
        defaultValue="center"
        isDisabled={isDisabled}
      >
        <Radio.Button value="left">Left</Radio.Button>
        <Radio.Button value="center">Center</Radio.Button>
        <Radio.Button isDisabled value="right">
          Right
        </Radio.Button>
      </Radio.ButtonGroup>
      <ToggleGroup
        aria-label="Align"
        qa="Toggles"
        size={size}
        defaultSelectedKey="center"
        isDisabled={isDisabled}
      >
        <ToggleGroup.Item key="left">Left</ToggleGroup.Item>
        <ToggleGroup.Item key="center">Center</ToggleGroup.Item>
        <ToggleGroup.Item key="right" isDisabled>
          Right
        </ToggleGroup.Item>
      </ToggleGroup>
    </>,
  );

  return {
    radios: screen.getAllByTestId('RadioButton'),
    toggles: screen.getAllByTestId('ToggleGroupItem'),
    radioGroup: screen.getByTestId('Radios'),
    toggleGroup: screen.getByTestId('Toggles'),
  };
}

const SCHEMES = ['light', 'dark'] as const;
const SIZES = ['small', 'medium'] as const;
const CASES = SCHEMES.flatMap((scheme) =>
  SIZES.map((size) => ({ scheme, size })),
);

describe.each(CASES)(
  'Joined button groups look the same ($scheme, size $size)',
  ({ scheme, size }) => {
    // React Aria ignores a hover until a pointer move has set the
    // interaction modality, so move the pointer once before any hover.
    beforeAll(async () => {
      await userEvent.hover(document.body);
    });

    beforeEach(() => {
      document.documentElement.setAttribute('data-scheme', scheme);
    });

    afterEach(() => {
      document.documentElement.removeAttribute('data-scheme');
    });

    it('at rest: group, selected, idle and disabled buttons', async () => {
      let { radios, toggles, radioGroup, toggleGroup } = renderBoth({ size });

      await settle();

      expect(groupLook(toggleGroup)).toEqual(groupLook(radioGroup));
      expect(groupLook(toggleGroup)).toEqual({
        gap: '0px',
        isolation: 'isolate',
      });

      for (let index = 0; index < radios.length; index++) {
        expect(buttonLook(toggles[index])).toEqual(buttonLook(radios[index]));
      }

      // The selected button is raised, so its border shows on every side.
      expect(buttonLook(toggles[1]).zIndex).toBe('1');
    });

    it('on hover over an idle button', async () => {
      let { radios, toggles } = renderBoth({ size });

      await settle();
      let idleFill = buttonLook(toggles[0]).fill;

      await userEvent.hover(radios[0]);
      await settle();
      let radioLook = buttonLook(radios[0]);

      await userEvent.hover(toggles[0]);
      await settle();

      // The hover style applied, so the comparison below is of two hovers.
      expect(buttonLook(toggles[0]).fill).not.toBe(idleFill);
      expect(buttonLook(toggles[0])).toEqual(radioLook);
    });

    it('when the whole group is disabled', async () => {
      let { radios, toggles } = renderBoth({ size, isDisabled: true });

      await settle();

      for (let index = 0; index < radios.length; index++) {
        expect(buttonLook(toggles[index])).toEqual(buttonLook(radios[index]));
      }
    });
  },
);

describe('ToggleGroup keyboard focus', () => {
  // A toggle draws its own ring. Raised above the selected button, it is
  // never covered by a neighbour.
  it('raises the focused button above the selected one', async () => {
    renderWithRoot(
      <>
        <button type="button">Before</button>
        <ToggleGroup aria-label="Align" defaultSelectedKey="center">
          <ToggleGroup.Item key="left">Left</ToggleGroup.Item>
          <ToggleGroup.Item key="center">Center</ToggleGroup.Item>
          <ToggleGroup.Item key="right">Right</ToggleGroup.Item>
        </ToggleGroup>
      </>,
    );

    let [left] = screen.getAllByTestId('ToggleGroupItem');

    screen.getByRole('button', { name: 'Before' }).focus();
    await userEvent.keyboard('{Tab}');
    await settle();

    expect(left).toHaveFocus();
    expect(getComputedStyle(left).zIndex).toBe('2');
    expect(getComputedStyle(left).outlineStyle).not.toBe('none');
  });

  // Real key presses: React Aria moves focus to the last toggle on Tab's
  // keydown and lets the browser go on from there, which user-event's
  // simulated Tab in jsdom does not follow.
  it.each(['single', 'multiple'] as const)(
    'gives the group one tab stop (%s)',
    async (selectionMode) => {
      renderWithRoot(
        <>
          <button type="button">Before</button>
          <ToggleGroup aria-label="Format" selectionMode={selectionMode}>
            <ToggleGroup.Item key="bold">Bold</ToggleGroup.Item>
            <ToggleGroup.Item key="italic">Italic</ToggleGroup.Item>
            <ToggleGroup.Item key="underline">Underline</ToggleGroup.Item>
          </ToggleGroup>
          <button type="button">After</button>
        </>,
      );

      let [bold, italic] = screen.getAllByTestId('ToggleGroupItem');

      screen.getByRole('button', { name: 'Before' }).focus();
      await userEvent.keyboard('{Tab}');
      expect(bold).toHaveFocus();

      await userEvent.keyboard('{ArrowRight}');
      expect(italic).toHaveFocus();

      await userEvent.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();

      // Coming back, focus returns to the toggle it left from.
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      expect(italic).toHaveFocus();
    },
  );
});
