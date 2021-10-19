import { forwardRef, useContext } from 'react';
import styledComponents from 'styled-components';
import { BreakpointsContext } from './providers/BreakpointsProvider';
import { modAttrs } from './utils/react';
import { useContextStyles } from './providers/StylesProvider';
import { AllBaseProps, BaseStyleProps, Props } from './components/types';
import { renderStyles } from './utils/renderStyles';
import { pointsToZones } from './utils/responsive';
import { Styles, StylesInterface } from './styles/types';
import { BASE_STYLES } from './styles/list';
import { ResponsiveStyleValue } from './utils/styles';

export interface StyledProps<T extends string, K extends PossibleStyleNames> {
  /** The name of the element. It can be used to override styles in context. */
  name?: string;
  /** The tag name of the element. */
  tag?: string;
  /** Default styles of the element. */
  styles?: Styles;
  /** Default css of the element. */
  css?: string | ((props: Props) => string);
  /** Default attributes */
  attrs?: Record<string, any>;
  /** The list of styles that can be provided by props */
  styleProps?: K;
  /** The list of available modifiers. Providing it will show a warning each time you set an incorrect modifier on the element */
  availableMods?: T[];
}

export type PossibleStyleNames = readonly (keyof StylesInterface)[];
export type AllPossibleStyleNames = readonly (keyof StylesInterface)[];

export type AllBasePropsWithMods<
  T extends string,
  K extends PossibleStyleNames,
> = Omit<AllBaseProps, 'mods'> & {
  mods?: Record<T, boolean | null | undefined>;
} & {
  [key in K[number]]?: ResponsiveStyleValue<StylesInterface[key]>;
} & BaseStyleProps;

function combineStyles(defaultStyles, contextStyles, styles, propStyles) {
  if (!defaultStyles && !contextStyles && !styles) return propStyles;

  return {
    ...defaultStyles,
    ...contextStyles,
    ...styles,
    ...propStyles,
  };
}

export function styled<T extends string, K extends PossibleStyleNames>(
  options: StyledProps<T, K>,
) {
  let {
    name,
    tag,
    styles: defaultStyles,
    styleProps,
    css: defaultCSS,
    attrs,
  } = options;
  let Element = styledComponents[tag || 'div'](({ theme }) => theme.css);

  if (name) {
    return forwardRef((allProps: AllBasePropsWithMods<T, K>, ref) => {
      let {
        as,
        styles,
        styleName,
        breakpoints,
        mods,
        qa,
        qaVal,
        css,
        ...props
      } = allProps;

      const propStyles: Styles = (
        (styleProps
          ? (styleProps as AllPossibleStyleNames).concat(BASE_STYLES)
          : BASE_STYLES) as AllPossibleStyleNames
      ).reduce((map, prop) => {
        if (prop in props) {
          map[prop] = props[prop];
        }

        return map;
      }, {});

      // @ts-ignore
      const contextStyles = useContextStyles(styleName || name, props);
      const allStyles: Styles | undefined = combineStyles(
        defaultStyles,
        contextStyles,
        styles,
        propStyles,
      );

      const contextBreakpoints = useContext(BreakpointsContext);
      const zones = pointsToZones(breakpoints || contextBreakpoints);

      css = `${
        typeof defaultCSS === 'function' ? defaultCSS(props) : defaultCSS || ''
      }${typeof css === 'function' ? css(props) : css || ''}${
        allStyles ? renderStyles(allStyles, zones) : ''
      }`;

      if (mods) {
        Object.assign(props, modAttrs(mods));
      }

      return (
        <Element
          as={as || tag}
          data-qa={qa}
          data-qaval={qaVal}
          {...attrs}
          {...props}
          ref={ref}
          theme={{ css }}
        />
      );
    });
  } else {
    return forwardRef((allProps: AllBasePropsWithMods<T, K>, ref) => {
      let { as, styles, breakpoints, mods, qa, qaVal, css, ...props }
        = allProps;

      const allPropStyles = (
        styleProps
          ? (styleProps as AllPossibleStyleNames).concat(BASE_STYLES)
          : BASE_STYLES
      ) as AllPossibleStyleNames;
      const propStyles: Styles = allPropStyles.reduce((map, prop) => {
        if (prop in props) {
          map[prop] = props[prop];
        }

        return map;
      }, {});

      const allStyles: Styles | undefined = combineStyles(
        defaultStyles,
        null,
        styles,
        propStyles,
      );
      const contextBreakpoints = useContext(BreakpointsContext);
      const zones = pointsToZones(breakpoints || contextBreakpoints);

      css = `${
        typeof defaultCSS === 'function' ? defaultCSS(props) : defaultCSS || ''
      }${typeof css === 'function' ? css(props) : css || ''}${
        allStyles ? renderStyles(allStyles, zones) : ''
      }`;

      if (mods) {
        Object.assign(props, modAttrs(mods));
      }

      return (
        <Element
          as={as || tag}
          data-qa={qa}
          data-qaval={qaVal}
          {...attrs}
          {...props}
          ref={ref}
          theme={{ css }}
        />
      );
    });
  }
}
