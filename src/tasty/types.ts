import { AriaLabelingProps } from '@react-types/shared';
import { AllHTMLAttributes, CSSProperties } from 'react';

import {
  BASE_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  CONTAINER_STYLES,
  DIMENSION_STYLES,
  FLOW_STYLES,
  OUTER_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from './styles/list';
import { Styles } from './styles/types';

export interface GlobalStyledProps {
  breakpoints?: number[];
}

type Caps =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

export interface BasePropsWithoutChildren<K extends TagName = TagName>
  extends Pick<AllHTMLAttributes<HTMLElement>, 'className' | 'role' | 'id'> {
  as?: K;
  /** QA ID for e2e testing. An alias for `data-qa` attribute. */
  qa?: string;
  /** QA value for e2e testing. An alias for `data-qaval` attribute. */
  qaVal?: string | number;
  /** Inner element name */
  element?: `${Caps}${string}`;
  /** The style map */
  styles?: Styles;
  /** The list of responsive points in pixels */
  breakpoints?: number[];
  /** Whether the element has the block layout outside */
  block?: boolean;
  /** Whether the element has the inline layout outside */
  inline?: boolean;
  /** The list of element modifiers **/
  mods?: { [key: string]: boolean | string | number | undefined | null };
  /** Whether the element is hidden (`hidden` attribute is set) */
  isHidden?: boolean;
  /** Whether the element is disabled (`disabled` attribute is set) */
  isDisabled?: boolean;
  /** Plain css for the element */
  css?: string;
  /** The CSS style map */
  style?:
    | CSSProperties
    | (CSSProperties & { [key: string]: string | number | null });
  /** User-defined theme for the element. Mapped to data-theme attribute. Use `default`, or `danger`, or any custom string value you need. */
  theme?: 'default' | 'danger' | 'special' | 'success' | (string & {});
}

export interface BaseProps<K extends TagName = TagName>
  extends AriaLabelingProps,
    BasePropsWithoutChildren<K>,
    Pick<AllHTMLAttributes<HTMLElementTagNameMap[K]>, 'children'> {}

export interface AllBaseProps<K extends TagName = TagName>
  extends BaseProps<K>,
    Omit<
      AllHTMLAttributes<HTMLElementTagNameMap[K]>,
      | 'style'
      | 'disabled'
      | 'hidden'
      | 'css'
      | 'content'
      | 'translate'
      | 'as'
      | 'form'
      | 'bgcolor'
      | 'background'
      | 'align'
      | 'border'
      | 'color'
      | 'height'
      | 'size'
      | 'width'
      | 'prefix'
    > {}

export type BaseStyleProps = Pick<Styles, (typeof BASE_STYLES)[number]>;
export type PositionStyleProps = Pick<Styles, (typeof POSITION_STYLES)[number]>;
export type BlockStyleProps = Pick<Styles, (typeof BLOCK_STYLES)[number]>;
export type ColorStyleProps = Pick<Styles, (typeof COLOR_STYLES)[number]>;
export type TextStyleProps = Pick<Styles, (typeof TEXT_STYLES)[number]>;
export type DimensionStyleProps = Pick<
  Styles,
  (typeof DIMENSION_STYLES)[number]
>;
export type FlowStyleProps = Pick<Styles, (typeof FLOW_STYLES)[number]>;
export type ContainerStyleProps = Pick<
  Styles,
  (typeof CONTAINER_STYLES)[number]
>;
export type OuterStyleProps = Pick<Styles, (typeof OUTER_STYLES)[number]>;

export type ShortGridStyles = {
  template?: Styles['gridTemplate'];
  columns?: Styles['gridColumns'];
  rows?: Styles['gridRows'];
  areas?: Styles['gridAreas'];
};

export interface Props {
  [key: string]: any;
}

export type TagName = keyof HTMLElementTagNameMap;
