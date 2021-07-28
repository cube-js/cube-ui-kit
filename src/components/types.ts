import { AllHTMLAttributes } from 'react';
import { AllStyles } from '../styles/types';

export interface BaseProps extends AllHTMLAttributes<Element> {
  /** QA ID for e2e testing **/
  qa?: string,
  /** QA value for e2e testing **/
  qaVal?: string | number,
  /** The tag name of the element **/
  as?: string,
  /** The style map **/
  styles?: AllStyles,
  /** The list of responsive points in pixels **/
  breakpoints?: number[],
  /** Whether the element has the block layout outside **/
  block?: boolean,
  /** Whether the element has the inline layout outside **/
  inline?: boolean,
  /** The list of element modifiers **/
  mods?: { [key: string]: boolean | undefined | null },
  /** Whether the element is hidden (`hidden` attribute is set) **/
  isHidden?: boolean,
  /** DEPRECATED: Whether the element is hidden (`hidden` attribute is set) **/
  hidden?: boolean,
  /** Whether the element is disabled (`disabled` attribute is set) **/
  isDisabled?: boolean,
  /** DEPRECATED: Whether the element is disabled (`disabled` attribute is set) **/
  disabled?: boolean,
  /** Plain css for the element **/
  css?: string,
}
