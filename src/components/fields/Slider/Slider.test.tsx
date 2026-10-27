import { createRef } from 'react';

import { act, renderWithForm, renderWithRoot, screen } from '../../../test';

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

/**
 * A slider's `isDisabled` reaches all of it: the field mutes its label and
 * hides its message, and the track and thumbs are disabled. `Slider` and
 * `RangeSlider` used to hand it to the track and thumbs only, so the field
 * never saw it, and a disabled form reached the field and thumbs but not the
 * track.
 */
describe.each([
  [
    'Slider',
    (props: object) => <Slider label="Volume" defaultValue={10} {...props} />,
  ],
  [
    'RangeSlider',
    (props: object) => (
      <RangeSlider label="Volume" defaultValue={[10, 20]} {...props} />
    ),
  ],
  [
    'HueSlider',
    (props: object) => (
      <HueSlider label="Volume" defaultValue={120} {...props} />
    ),
  ],
] as const)('a disabled %s', (_, render) => {
  it('mutes its label', () => {
    renderWithRoot(render({ isDisabled: true }));

    expect(screen.getByTestId('Label')).toHaveAttribute('data-disabled');
  });

  it('hides its error message, as every disabled field does', () => {
    renderWithRoot(
      render({ isDisabled: true, isInvalid: true, errorMessage: 'Too loud' }),
    );

    expect(screen.queryByText('Too loud')).not.toBeInTheDocument();
  });

  it('disables its track and thumbs in a disabled form', () => {
    renderWithForm(render({ name: 'volume' }), {
      formProps: { isDisabled: true },
    });

    expect(screen.getByTestId('SliderTrackContainer')).toHaveAttribute(
      'data-disabled',
    );

    for (const thumb of screen.getAllByRole('slider')) {
      expect(thumb).toBeDisabled();
    }
  });
});
