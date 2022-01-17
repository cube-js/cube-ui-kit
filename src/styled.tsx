import { ComponentType, forwardRef, useContext } from 'react';
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
import { mergeStyles } from './utils/mergeStyles';

export type AllBasePropsWithMods<K extends (keyof StylesInterface)[]> = AllBaseProps & {
  [key in K[number]]?: ResponsiveStyleValue<StylesInterface[key]>;
} & BaseStyleProps;

export function styled<K extends(keyof StylesInterface)[], C = {}>(
  options: StyledProps<K> | ComponentType<C>,
  extendOptions?: Pick<StyledProps<K>, 'styles' | 'props' | 'name' | 'tag'>,
) {
  if (typeof options === 'function') {
    const Component = options;

    let {
      styles: extendStyles,
      props: defaultProps,
      name: styleName,
      tag: extendTag,
    } = extendOptions || {};

    return forwardRef((props: C, ref) => {
      let allProps = props as AllBasePropsWithMods<K>;

      if (allProps.styles) {
        if (extendStyles) {
          allProps.styles = mergeStyles(allProps.styles, extendStyles);
        }
      } else if (extendStyles) {
        allProps.styles = extendStyles;
      }

      if (styleName) {
        allProps.styleName = styleName;
      }

      if (extendTag) {
        allProps.as = extendTag;
      }

      if (defaultProps) {
        allProps = Object.assign({}, defaultProps, allProps);
      }

      return <Component ref={ref} {...allProps as C}/>;
    });
  }

  const {
    name,
    tag,
    css: defaultCSS,
    styles: defaultStyles,
    props: defaultProps,
    styleProps,
  } = options;

  let Element = styledComponents[options.tag || 'div'](({css}) => css);

  return forwardRef((allProps: AllBasePropsWithMods<K>, ref) => {
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
        ? (styleProps as (keyof StylesInterface)[]).concat(BASE_STYLES)
        : BASE_STYLES) as (keyof StylesInterface)[]
    ).reduce((map, prop) => {
      if (prop in props) {
        map[prop] = props[prop];

        delete props[prop];
      }

      return map;
    }, {});

    // @ts-ignore
    const contextStyles = useContextStyles(styleName || name, props);
    const allStyles: Styles = mergeStyles(
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
        {...defaultProps}
        {...props}
        ref={ref}
        css={css}
      />
    );
  });
}
