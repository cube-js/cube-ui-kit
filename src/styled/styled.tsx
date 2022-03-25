import styledComponents, { createGlobalStyle } from 'styled-components';
import { ComponentType, FC, forwardRef, useContext, useMemo } from 'react';
import { isValidElementType } from 'react-is';
import { BreakpointsContext } from '../providers/BreakpointsProvider';
import { modAttrs } from '../utils/react';
import { useContextStyles } from '../providers/StylesProvider';
import {
  AllBaseProps,
  BaseStyleProps,
  StyledProps,
  GlobalStyledProps,
} from '../components/types';
import { renderStyles } from '../utils/renderStyles';
import { pointsToZones } from '../utils/responsive';
import { Styles, StylesInterface } from '../styles/types';
import { BASE_STYLES } from '../styles/list';
import { ResponsiveStyleValue } from '../utils/styles';
import { mergeStyles } from '../utils/mergeStyles';
import { deprecationWarning } from '../utils/warnings';

export type AllBasePropsWithMods<K extends (keyof StylesInterface)[]> =
  AllBaseProps & {
    [key in K[number]]?: ResponsiveStyleValue<StylesInterface[key]>;
  } & BaseStyleProps;

type StyledPropsWithDefaults<
  Props extends { styles?: Styles },
  DefaultProps extends Partial<Props>,
> = keyof DefaultProps extends never
  ? Props
  : {
      [key in Extract<keyof Props, keyof DefaultProps>]?: Props[key];
    } & {
      [key in keyof Omit<Props, keyof DefaultProps>]: Props[key];
    };

type EitherLegacyPropsOrInlined<
  K extends (keyof StylesInterface)[],
  DefaultProps,
> =
  | ((Pick<StyledProps<K>, 'name' | 'tag' | 'styles'> & {
      /**
       * @deprecated
       */
      props?: DefaultProps;
    }) & { [key in keyof DefaultProps]?: never })
  | ({ props?: never } & DefaultProps);

function styled<K extends (keyof StylesInterface)[]>(
  options: StyledProps<K>,
  secondArg?: never,
);
function styled(selector: string, styles?: Styles);
function styled<
  K extends (keyof StylesInterface)[],
  Props extends { styles?: Styles },
  DefaultProps extends Partial<Props> = Partial<Props>,
>(
  Component: ComponentType<Props>,
  options?: EitherLegacyPropsOrInlined<K, DefaultProps>,
): ComponentType<StyledPropsWithDefaults<Props, DefaultProps>>;

// Implementation
function styled<
  K extends (keyof StylesInterface)[],
  C = Record<string, unknown>,
>(Component, options) {
  deprecationWarning(options?.props == null && Component.props == null, {
    property: 'props',
    name: 'styled api',
    betterAlternative:
      "inline props directly in styled(), eg: styled({ type: 'confirm' })",
  });

  if (typeof Component === 'string') {
    let selector = Component;
    let styles = options;
    let Element = createGlobalStyle`${(css) => css}`;

    const _Component: FC<GlobalStyledProps> = ({ breakpoints }) => {
      let contextBreakpoints = useContext(BreakpointsContext);
      let zones = pointsToZones(breakpoints || contextBreakpoints);

      let css = `${
        styles ? `\n{}${selector}{${renderStyles(styles, zones)}}` : ''
      }`;

      return <Element css={css} />;
    };

    _Component.displayName = `CubeStyled(${
      Element.displayName ?? Element.name ?? Component
    })`;

    return _Component;
  }

  if (isValidElementType(Component)) {
    let {
      styles: extendStyles,
      props: legacyDefaultProps,
      name,
      tag: extendTag,
      ...defaultProps
    } = options ?? {};

    const _StyledComponent = forwardRef((props: C, ref) => {
      const { styles, styleName, as, ...restProps } =
        props as AllBasePropsWithMods<K>;

      const mergedStyles: Styles | undefined = useMemo(() => {
        if (extendStyles != null && styles != null) {
          return mergeStyles(extendStyles, styles);
        }

        return extendStyles;
      }, [styles]);

      return (
        <Component
          ref={ref}
          {...legacyDefaultProps}
          {...defaultProps}
          {...restProps}
          styles={mergedStyles}
          styleName={styleName ?? name}
          as={as ?? extendTag}
        />
      );
    });

    _StyledComponent.displayName = `CubeStyled(${
      Component.displayName ?? Component.name ?? 'Anonymous'
    })`;

    return _StyledComponent;
  }

  options = Component;

  let {
    name,
    tag = 'div',
    css: defaultCSS,
    styles: defaultStyles,
    props: legacyDefaultProps,
    styleProps,
    ...defaultProps
  } = options;

  let Element = styledComponents[tag](({ css }) => css);

  let _StyledComponent = forwardRef(
    (allProps: AllBasePropsWithMods<K>, ref) => {
      let {
        as,
        styles,
        styleName,
        breakpoints,
        mods,
        element,
        qa,
        qaVal,
        css,
        ...props
      } = allProps;

      let propStyles: Styles = useMemo(
        () =>
          (
            (styleProps
              ? (styleProps as (keyof StylesInterface)[]).concat(BASE_STYLES)
              : BASE_STYLES) as (keyof StylesInterface)[]
          ).reduce((map, prop) => {
            if (prop in props) {
              map[prop] = props[prop];

              delete props[prop];
            }

            return map;
          }, {}),
        [props],
      );

      let contextStyles = useContextStyles(styleName ?? name, props);
      let allStyles: Styles = useMemo(
        () => mergeStyles(defaultStyles, contextStyles, styles, propStyles),
        [contextStyles, styles, propStyles],
      );

      let contextBreakpoints = useContext(BreakpointsContext);
      let zones = pointsToZones(breakpoints ?? contextBreakpoints);

      css = `${
        typeof defaultCSS === 'function' ? defaultCSS(props) : defaultCSS ?? ''
      }${typeof css === 'function' ? css(props) : css ?? ''}${
        allStyles ? renderStyles(allStyles, zones) : ''
      }`;

      if (mods) {
        Object.assign(props, modAttrs(mods));
      }

      return (
        <Element
          as={as ?? tag}
          data-element={element}
          data-qa={qa}
          data-qaval={qaVal}
          {...legacyDefaultProps}
          {...defaultProps}
          {...props}
          ref={ref}
          css={css}
        />
      );
    },
  );

  _StyledComponent.displayName = `CubeStyled(${
    Element.displayName ?? Element.name ?? tag
  })`;

  return _StyledComponent;
}

export { styled };
