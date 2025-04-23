import { ComponentType, FC, forwardRef, useContext, useMemo } from 'react';
import { isValidElementType } from 'react-is';
import styledComponents, { createGlobalStyle } from 'styled-components';

import { BreakpointsContext } from './providers/BreakpointsProvider';
import { BASE_STYLES } from './styles/list';
import { Styles, StylesInterface } from './styles/types';
import { AllBaseProps, BaseProps, BaseStyleProps, Props } from './types';
import { cacheWrapper } from './utils/cache-wrapper';
import { getDisplayName } from './utils/getDisplayName';
import { mergeStyles } from './utils/mergeStyles';
import { modAttrs } from './utils/modAttrs';
import { renderStyles } from './utils/renderStyles';
import { pointsToZones } from './utils/responsive';
import { ResponsiveStyleValue } from './utils/styles';

type StyledElementProps = {
  $css: string;
};

type StyleList = readonly (keyof {
  [key in keyof StylesInterface]: StylesInterface[key];
})[];

export type PropsWithStyles = {
  styles?: Styles;
} & Omit<Props, 'styles'>;

export type VariantMap = Record<string, Styles>;

export type WithVariant<V extends VariantMap> = {
  variant?: keyof V;
};

export type TastyProps<
  K extends StyleList,
  V extends VariantMap,
  DefaultProps = Props,
> = {
  /** The tag name of the element. */
  as?: string;
  /** Default styles of the element. */
  styles?: Styles;
  /** The list of styles that can be provided by props */
  styleProps?: K;
  element?: BaseProps['element'];
  variants?: V;
} & Partial<Omit<DefaultProps, 'as' | 'styles' | 'styleProps'>> &
  Pick<BaseProps, 'qa' | 'qaVal'> &
  WithVariant<V>;

export interface GlobalTastyProps {
  breakpoints?: number[];
}

export type AllBasePropsWithMods<K extends StyleList> = AllBaseProps & {
  [key in K[number]]?: ResponsiveStyleValue<StylesInterface[key]>;
} & BaseStyleProps;

type TastyComponentPropsWithDefaults<
  Props extends PropsWithStyles,
  DefaultProps extends Partial<Props>,
> = keyof DefaultProps extends never
  ? Props
  : {
      [key in Extract<keyof Props, keyof DefaultProps>]?: Props[key];
    } & {
      [key in keyof Omit<Props, keyof DefaultProps>]: Props[key];
    };

function tasty<K extends StyleList, V extends VariantMap>(
  options: TastyProps<K, V>,
  secondArg?: never,
): ComponentType<Omit<Props, 'variant'> & WithVariant<V>>;
function tasty(selector: string, styles?: Styles);
function tasty<
  Props extends PropsWithStyles,
  DefaultProps extends Partial<Props> = Partial<Props>,
>(
  Component: ComponentType<Props>,
  options?: TastyProps<never, never, Props>,
): ComponentType<TastyComponentPropsWithDefaults<Props, DefaultProps>>;

// Implementation
function tasty<
  K extends StyleList,
  V extends VariantMap,
  C = Record<string, unknown>,
>(Component, options) {
  if (typeof Component === 'string') {
    let selector = Component;
    let styles = options;
    let Element = createGlobalStyle<StyledElementProps>`${({ $css }) => $css}`;

    const _StyleDeclarationComponent: FC<GlobalTastyProps> = ({
      breakpoints,
    }) => {
      let contextBreakpoints = useContext(BreakpointsContext);

      breakpoints = breakpoints ?? contextBreakpoints;

      const breakpointsHash = breakpoints.join(',');

      let css = useMemo(
        () =>
          styles
            ? `\n{}${selector}{${renderStyles(
                styles,
                pointsToZones(breakpoints || [980]),
              )}}`
            : '',
        [breakpointsHash],
      );

      return <Element $css={css} />;
    };

    _StyleDeclarationComponent.displayName = `TastyStyleDeclaration(${Component})`;

    return _StyleDeclarationComponent;
  }

  if (isValidElementType(Component)) {
    let {
      as: extendTag,
      element: extendElement,
      ...defaultProps
    } = options ?? {};

    let propsWithStyles = ['styles'].concat(
      Object.keys(defaultProps).filter((prop) => prop.endsWith('Styles')),
    );

    let _WrappedComponent = forwardRef((props: C, ref) => {
      const { as, element, ...restProps } =
        props as unknown as AllBasePropsWithMods<K>;
      const propsWithStylesValues = propsWithStyles.map((prop) => props[prop]);

      const mergedStylesMap: Styles | undefined = useMemo(() => {
        return propsWithStyles.reduce((map, prop) => {
          if (restProps[prop] != null && defaultProps[prop] != null) {
            map[prop] = mergeStyles(defaultProps[prop], restProps[prop]);
          } else {
            map[prop] = restProps[prop] || defaultProps[prop];
          }

          return map;
        }, {});
      }, [propsWithStylesValues]);

      return (
        <Component
          ref={ref}
          {...defaultProps}
          {...restProps}
          {...mergedStylesMap}
          as={as ?? extendTag}
          element={element || extendElement}
        />
      );
    });

    _WrappedComponent.displayName = `TastyWrappedComponent(${getDisplayName(
      Component,
      defaultProps.qa ?? extendTag ?? 'Anonymous',
    )})`;

    return _WrappedComponent;
  }

  const tastyOptions = Component as TastyProps<K, never, V>;

  let {
    as: originalAs = 'div',
    element: defaultElement,
    styles: defaultStyles,
    styleProps,
    variants,
    ...defaultProps
  } = tastyOptions;

  let _TastyComponent;

  if (variants) {
    /**
     * Create a tasty component for each variant.
     * Then return a component that receives a `variant` and chooses the right component.
     */
    const variantComponents = Object.keys(variants).reduce((map, variant) => {
      const variantStyles = variants?.[variant];

      map[variant] = tasty({
        as: originalAs,
        styles: mergeStyles(defaultStyles, variantStyles),
        styleProps,
        ...(defaultProps as Props),
      });

      return map;
    }, {});

    if (!variantComponents['default']) {
      variantComponents['default'] = tasty({
        as: originalAs,
        styles: defaultStyles,
        styleProps,
        ...(defaultProps as Props),
      });
    }

    // eslint-disable-next-line react/display-name
    _TastyComponent = forwardRef(
      (allProps: AllBasePropsWithMods<K> & WithVariant<V>, ref) => {
        const { variant, ...restProps } = allProps;

        const Component = (variantComponents[variant as string] ||
          variantComponents['default']) as ComponentType<
          AllBasePropsWithMods<K>
        >;

        return (
          <Component
            // @ts-ignore
            ref={ref}
            {...(restProps as Props)}
          />
        );
      },
    );
  } else {
    let Element = styledComponents[originalAs](({ $css }) => $css);

    /**
     * An additional optimization that allows to avoid rendering styles across various instances
     * of the same element if no custom styles are provided via `styles` prop or direct style props.
     */
    const renderDefaultStyles = cacheWrapper((breakpoints) => {
      return renderStyles(defaultStyles || {}, pointsToZones(breakpoints));
    });

    let {
      qa: defaultQa,
      qaVal: defaultQaVal,
      ...otherDefaultProps
    } = defaultProps ?? {};

    // eslint-disable-next-line react/display-name
    _TastyComponent = forwardRef(
      (allProps: AllBasePropsWithMods<K> & WithVariant<V>, ref) => {
        let {
          as,
          styles,
          variant,
          breakpoints,
          mods,
          element,
          qa,
          qaVal,
          ...otherProps
        } = allProps;

        let propStyles: Styles | null = (
          (styleProps
            ? (styleProps as StyleList).concat(BASE_STYLES)
            : BASE_STYLES) as StyleList
        ).reduce((map, prop) => {
          if (prop in otherProps) {
            map[prop] = otherProps[prop];

            delete otherProps[prop];
          }

          return map;
        }, {});

        if (Object.keys(propStyles).length === 0) {
          propStyles = null;
        }

        if (!styles || (styles && Object.keys(styles).length === 0)) {
          styles = undefined;
        }

        const propStylesCacheKey = JSON.stringify(propStyles);
        const stylesCacheKey = useMemo(() => {
          return JSON.stringify(styles);
        }, [styles]);

        const useDefaultStyles = !propStyles && !styles;

        const styleCacheKey = useMemo(() => {
          return `${styles ? JSON.stringify(styles) : ''}.${
            propStyles ? JSON.stringify(propStyles) : ''
          }`;
        }, [propStylesCacheKey, stylesCacheKey]);

        let allStyles: Styles | undefined = useMemo(
          () =>
            useDefaultStyles
              ? defaultStyles
              : mergeStyles(defaultStyles, styles, propStyles),
          [styleCacheKey],
        );

        let contextBreakpoints = useContext(BreakpointsContext);

        breakpoints = breakpoints ?? contextBreakpoints;

        let renderedStyles = useMemo(() => {
          return useDefaultStyles
            ? renderDefaultStyles(breakpoints as number[])
            : renderStyles(allStyles, pointsToZones(breakpoints as number[]));
        }, [allStyles, breakpoints]);

        if (mods) {
          Object.assign(otherProps, modAttrs(mods));
        }

        return (
          <Element
            as={as ?? originalAs}
            data-element={element || defaultElement}
            data-qa={qa || defaultQa}
            data-qaval={qaVal || defaultQaVal}
            {...otherDefaultProps}
            {...otherProps}
            ref={ref}
            $css={renderedStyles}
          />
        );
      },
    );
  }

  _TastyComponent.displayName = `TastyComponent(${
    defaultProps.qa || originalAs
  })`;

  return _TastyComponent;
}

const Element = tasty({});

export { tasty, Element };
