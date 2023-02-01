import { SliderState } from '@react-stately/slider';

import { SliderGradationElement, SliderGradeElement } from './elements';

export type GradationProps = {
  state: SliderState;
  ranges: number[];
  values?: string[];
};

export function Gradation(props: GradationProps) {
  const { state, ranges, values = [] } = props;

  if (!values.length) {
    return null;
  }

  const getIsActive = (value: string, idx: number) => {
    const [minIdx, maxIdx] = ranges.map((range) => state.getThumbValue(range));

    return idx >= minIdx && idx <= maxIdx;
  };

  return (
    <SliderGradationElement>
      {values.map((value, idx) => (
        <SliderGradeElement
          key={value}
          mods={{
            active: getIsActive(value, idx),
          }}
        >
          {value}
        </SliderGradeElement>
      ))}
    </SliderGradationElement>
  );
}
