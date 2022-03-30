import { AllHTMLAttributes, CSSProperties } from 'react';
import { Styles, StylesInterface } from '../styles/types';
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
} from '../styles/list';

export interface GlobalStyledProps {
  breakpoints?: number[];
}

export type StyledProps<K extends (keyof StylesInterface)[], DefaultProps> = {
  /** The name of the element. It can be used to override styles in context. */
  name?: string;
  /** The tag name of the element. */
  tag?: string;
  /** Default styles of the element. */
  styles?: Styles;
  /** Default css of the element. */
  css?: string | ((props: Props) => string);
  props?: DefaultProps;
  /** The list of styles that can be provided by props */
  styleProps?: K;
};

export interface BasePropsWithoutChildren
  extends Pick<AllHTMLAttributes<HTMLElement>, 'className' | 'role' | 'id'> {
  /** QA ID for e2e testing. An alias for `data-qa` attribute. */
  qa?: string;
  /** QA value for e2e testing. An alias for `data-qaval` attribute. */
  qaVal?: string | number;
  /** Inner element name */
  element?: string;
  /** The style map */
  styles?: Styles;
  /** The list of responsive points in pixels */
  breakpoints?: number[];
  /** Whether the element has the block layout outside */
  block?: boolean;
  /** Whether the element has the inline layout outside */
  inline?: boolean;
  /** The list of element modifiers **/
  mods?: { [key: string]: boolean | undefined | null };
  /** Whether the element is hidden (`hidden` attribute is set) */
  isHidden?: boolean;
  /** Whether the element is disabled (`disabled` attribute is set) */
  isDisabled?: boolean;
  /** Plain css for the element */
  css?: string | ((props: Props) => string);
  /** The element name for using in style overriding */
  styleName?: string;
  /** The CSS style map */
  style?:
    | CSSProperties
    | (CSSProperties & { [key: string]: string | number | null });
  /** User-defined theme for the element. Mapped to data-theme attribute. Use `default`, or `danger`, or any custom string value you need. */
  theme?: 'default' | 'danger' | string;
}

export interface BaseProps
  extends BasePropsWithoutChildren,
    Pick<AllHTMLAttributes<HTMLElementTagNameMap['div']>, 'children'> {}

export interface AllBaseProps<K extends keyof HTMLElementTagNameMap = 'div'>
  extends BaseProps,
    Omit<
      AllHTMLAttributes<HTMLElementTagNameMap[K]>,
      | 'style'
      | 'size'
      | 'disabled'
      | 'hidden'
      | 'css'
      | 'color'
      | 'height'
      | 'width'
    > {
  as?: string;
}

export type BaseStyleProps = Pick<Styles, typeof BASE_STYLES[number]>;
export type PositionStyleProps = Pick<Styles, typeof POSITION_STYLES[number]>;
export type BlockStyleProps = Pick<Styles, typeof BLOCK_STYLES[number]>;
export type ColorStyleProps = Pick<Styles, typeof COLOR_STYLES[number]>;
export type TextStyleProps = Pick<Styles, typeof TEXT_STYLES[number]>;
export type DimensionStyleProps = Pick<Styles, typeof DIMENSION_STYLES[number]>;
export type FlowStyleProps = Pick<Styles, typeof FLOW_STYLES[number]>;
export type ContainerStyleProps = Pick<Styles, typeof CONTAINER_STYLES[number]>;
export type OuterStyleProps = Pick<Styles, typeof OUTER_STYLES[number]>;

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

export interface TagNameProps {
  /** The tag name you want to use for the element */
  as?: TagName;
}
