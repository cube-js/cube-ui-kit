import { SliderState } from '@react-stately/slider';

import { StyledGradation, StyledGrade } from './styled';

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
    <StyledGradation>
      {values.map((value, idx) => (
        <StyledGrade
          key={value}
          mods={{
            active: getIsActive(value, idx),
          }}
        >
          {value}
        </StyledGrade>
      ))}
    </StyledGradation>
  );
}
