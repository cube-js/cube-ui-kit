import type {
  CubeColorInputProps,
  CubeColorPickerProps,
  CubeDatePickerProps,
  CubeDateRangePickerProps,
  CubeDateRangeSeparatedPickerProps,
  CubeFilterPickerProps,
  CubePeriodPickerProps,
  CubePickerProps,
} from '@cube-dev/ui-kit';

type Assert<T extends true> = T;
type FixedPresentation<T> =
  Extract<'dialogType' | 'dialogMobileType', keyof T> extends never
    ? true
    : false;

export type FixedPickerPresentations = [
  Assert<FixedPresentation<CubePickerProps<string>>>,
  Assert<FixedPresentation<CubeFilterPickerProps<string>>>,
  Assert<FixedPresentation<CubeDatePickerProps>>,
  Assert<FixedPresentation<CubeDateRangePickerProps>>,
  Assert<FixedPresentation<CubeDateRangeSeparatedPickerProps>>,
  Assert<FixedPresentation<CubePeriodPickerProps>>,
  Assert<FixedPresentation<CubeColorPickerProps>>,
  Assert<FixedPresentation<CubeColorInputProps>>,
];
