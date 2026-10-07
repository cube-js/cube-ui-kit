import { createRef } from 'react';

import { renderWithRoot, screen } from '../../../test';

import { RangeSlider } from './RangeSlider';
import { Slider } from './Slider';

import type { FocusableRefValue } from '@react-types/shared';

// Under React 18 a `ref` reaches only a `forwardRef` component, and CI runs
// this suite on React 18 too.
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
