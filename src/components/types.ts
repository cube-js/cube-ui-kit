import {
  AllHTMLAttributes,
  CSSProperties,
  FormEventHandler,
  HTMLAttributes,
  JSXElementConstructor,
  ReactElement,
  ReactNodeArray,
  ReactPortal,
} from 'react';
import { NuStyles } from '../styles/types';
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
import { DOMProps } from '@react-types/shared';

export interface BasePropsWithoutChildren extends DOMProps {
  /** QA ID for e2e testing **/
  qa?: string;
  /** QA value for e2e testing **/
  qaVal?: string | number;
  /** The tag name of the element **/
  as?: string;
  /** The style map **/
  styles?: NuStyles;
  /** The list of responsive points in pixels **/
  breakpoints?: number[];
  /** Whether the element has the block layout outside **/
  block?: boolean;
  /** Whether the element has the inline layout outside **/
  inline?: boolean;
  /** The list of element modifiers **/
  mods?: { [key: string]: boolean | undefined | null };
  /** Whether the element is hidden (`hidden` attribute is set) **/
  isHidden?: boolean;
  /** DEPRECATED: Whether the element is hidden (`hidden` attribute is set) **/
  hidden?: boolean;
  /** Whether the element is disabled (`disabled` attribute is set) **/
  isDisabled?: boolean;
  /** DEPRECATED: Whether the element is disabled (`disabled` attribute is set) **/
  disabled?: boolean;
  /** Plain css for the element **/
  css?: string;
  /** The list of CSS classes */
  className?: string;
  /** The accessibility role */
  role?: string;
  /** The CSS style map */
  style?:
    | CSSProperties
    | (CSSProperties & { [key: string]: string | number | null });
}

export interface BaseProps extends BasePropsWithoutChildren {
  children?:
    | ReactElement<any, string | JSXElementConstructor<any>>
    | string
    | number
    | {}
    | ReactNodeArray
    | ReactPortal
    | boolean
    | null
    | undefined;
}

export interface AllBaseProps
  extends BaseProps,
    Omit<HTMLAttributes<HTMLElement>, 'style' | 'role'> {
  /** The type attribute is a generic attribute and it has different meaning based on the context
   * in which it's used. */
  type?: AllHTMLAttributes<HTMLButtonElement>['type'];
  /** The rel attribute defines the relationship between a linked resource and the current document.
   * Valid on <link>, <a>, <area>, and <form>, the supported values depend on the element on which
   * the attribute is found. */
  rel?: AllHTMLAttributes<HTMLLinkElement>['rel'];
  /** The target attribute should be used when there are multiple possible targets for the ending
   * resource, such as when the parent document is embedded within an HTML or XHTML document, or is
   * viewed with a tabbed browser. This attribute specifies the name of the browsing context (e.g.,
   * a browser tab or an (X)HTML iframe or object element) into which a document is to be opened
   * when the link is activated. */
  target?: AllHTMLAttributes<HTMLLinkElement>['target'];
  /** The href attribute defines a link to a resource as a reference URL. The exact meaning of that
   * link depends on the context of each element using it. */
  href?: AllHTMLAttributes<HTMLLinkElement>['href'];
  /** The rows attribute in HTML is used to specify the number of visible text lines for the
   * control i.e the number of rows to display. */
  rows?: AllHTMLAttributes<HTMLInputElement>['rows'];
  /** The for attribute is an allowed attribute for <label> and <output>. When used on a <label>
   * element it indicates the form element that this label describes. When used on an <output>
   * element it allows for an explicit relationship between the elements that represent values
   * which are used in the output. */
  htmlFor?: AllHTMLAttributes<HTMLLabelElement>['htmlFor'];
  /** Form event handler */
  onSubmit?: FormEventHandler;
  /** Form attribute to disable built-in validation */
  noValidate?: boolean;
}

export type BaseStyleProps = Pick<NuStyles, typeof BASE_STYLES[number]>;
export type PositionStyleProps = Pick<NuStyles, typeof POSITION_STYLES[number]>;
export type BlockStyleProps = Pick<NuStyles, typeof BLOCK_STYLES[number]>;
export type ColorStyleProps = Pick<NuStyles, typeof COLOR_STYLES[number]>;
export type TextStyleProps = Pick<NuStyles, typeof TEXT_STYLES[number]>;
export type DimensionStyleProps = Pick<
  NuStyles,
  typeof DIMENSION_STYLES[number]
>;
export type FlowStyleProps = Pick<NuStyles, typeof FLOW_STYLES[number]>;
export type ContainerStyleProps = Pick<
  NuStyles,
  typeof CONTAINER_STYLES[number]
>;
export type OuterStyleProps = Pick<NuStyles, typeof OUTER_STYLES[number]>;
export type ShortItemsStyles = {
  align?: NuStyles['alignItems'];
  justify?: NuStyles['justifyItems'];
};

export type ShortGridStyles = {
  template?: NuStyles['gridTemplate'];
  columns?: NuStyles['gridColumns'];
  rows?: NuStyles['gridRows'];
  areas?: NuStyles['gridAreas'];
};

export interface Props {
  [key: string]: any;
}
