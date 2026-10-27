import { userEvent } from 'vitest/browser';

import { renderWithRoot, screen } from '../../../test';

import { RangeSlider } from './RangeSlider';
import { Slider } from './Slider';

/**
 * A press on a disabled slider's track moves no thumb, whichever part of the
 * slider learns it is disabled. Track presses need real layout, so this runs
 * in a browser; `Slider.test.tsx` covers the rest of the disabled state.
 */
const sliders = [
  ['Slider', (props: object) => <Slider defaultValue={10} {...props} />],
  [
    'RangeSlider',
    (props: object) => <RangeSlider defaultValue={[10, 20]} {...props} />,
  ],
] as const;

function values() {
  return screen
    .getAllByRole('slider')
    .map((thumb) => (thumb as HTMLInputElement).value);
}

async function clickTrackEnd() {
  const track = document.querySelector(
    '[data-qa="SliderControls"]',
  ) as HTMLElement;
  const box = track.getBoundingClientRect();

  await userEvent.click(track, {
    position: { x: box.width - 2, y: box.height / 2 },
  });
}

describe.each(sliders)('a disabled %s', (_, render) => {
  it('moves no thumb on a track click', async () => {
    renderWithRoot(render({ label: 'Volume', isDisabled: true }));

    const before = values();

    await clickTrackEnd();

    expect(values()).toEqual(before);
  });

  it('still moves a thumb on a track click when enabled', async () => {
    renderWithRoot(render({ label: 'Volume' }));

    const before = values();

    await clickTrackEnd();

    expect(values()).not.toEqual(before);
  });
});
