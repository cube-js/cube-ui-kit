import { forwardRef, useContext } from 'react';
import styledComponents from 'styled-components';
import { BreakpointsContext } from './providers/BreakpointsProvider';
import { modAttrs } from './utils/react';
import { useContextStyles } from './providers/StylesProvider';
import { AllBaseProps, BaseStyleProps, StyledProps } from './components/types';
import { renderStyles } from './utils/renderStyles';
import { pointsToZones } from './utils/responsive';
import { Styles, StylesInterface } from './styles/types';
import { BASE_STYLES } from './styles/list';
import { ResponsiveStyleValue } from './utils/styles';

export type AllBasePropsWithMods<
  T extends string,
  K extends string[],
> = Omit<AllBaseProps, 'mods'> & {
  mods?: Record<T, boolean | null | undefined>;
} & {
  [key in K[number]]?: ResponsiveStyleValue<key extends keyof StylesInterface ? StylesInterface[key] : string>;
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

export function styled<T extends string, K extends string[]>(
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
  let Element = styledComponents[tag || 'div'](({ css }) => css);

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
        ? (styleProps as string[]).concat(BASE_STYLES)
        : BASE_STYLES) as string[]
    ).reduce((map, prop) => {
      if (prop in props) {
        map[prop] = props[prop];

        delete props[prop];
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
        css={css}
      />
    );
  });
}
