import { createRef } from 'react';

import { act, renderWithRoot, screen } from '../../../test';

import { HueSlider } from './HueSlider';
import { RangeSlider } from './RangeSlider';
import { Slider } from './Slider';

import type { FocusableRefValue } from '@react-types/shared';

describe('Slider ref', () => {
  it('reaches a Slider', () => {
    const ref = createRef<FocusableRefValue<HTMLDivElement>>();

    renderWithRoot(<Slider ref={ref} label="Volume" defaultValue={10} />);

    expect(ref.current?.UNSAFE_getDOMNode()).toContainElement(
      screen.getByRole('slider'),
    );
  });

  it('reaches a RangeSlider', () => {
    const ref = createRef<FocusableRefValue<HTMLDivElement>>();

    renderWithRoot(
      <RangeSlider ref={ref} label="Range" defaultValue={[10, 20]} />,
    );

    expect(ref.current?.UNSAFE_getDOMNode()).toContainElement(
      screen.getAllByRole('slider')[0],
    );
  });
});

describe('Slider ref focus()', () => {
  it('focuses the thumb of a Slider', () => {
    const ref = createRef<FocusableRefValue<HTMLDivElement>>();

    renderWithRoot(<Slider ref={ref} label="Volume" defaultValue={10} />);

    act(() => ref.current?.focus());

    expect(screen.getByRole('slider')).toHaveFocus();
  });

  it('focuses the thumb of a HueSlider', () => {
    const ref = createRef<FocusableRefValue<HTMLDivElement>>();

    renderWithRoot(<HueSlider ref={ref} label="Hue" defaultValue={120} />);

    act(() => ref.current?.focus());

    expect(screen.getByRole('slider')).toHaveFocus();
  });

  it('focuses the first thumb of a RangeSlider', () => {
    const ref = createRef<FocusableRefValue<HTMLDivElement>>();

    renderWithRoot(
      <RangeSlider ref={ref} label="Range" defaultValue={[10, 20]} />,
    );

    act(() => ref.current?.focus());

    expect(screen.getAllByRole('slider')[0]).toHaveFocus();
  });
});
