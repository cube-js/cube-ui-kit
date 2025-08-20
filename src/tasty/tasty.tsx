import {
  ComponentType,
  createElement,
  FC,
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  useContext,
  useMemo,
} from 'react';
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

// Basic props accepted by our styled base element
type BaseElementProps = StyledElementProps & { as?: string } & Record<
    string,
    unknown
  >;

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

export function tasty<K extends StyleList, V extends VariantMap>(
  options: TastyProps<K, V>,
  secondArg?: never,
): ComponentType<Omit<Props, 'variant'> & WithVariant<V>>;
export function tasty(selector: string, styles?: Styles);
export function tasty<
  Props extends PropsWithStyles,
  DefaultProps extends Partial<Props> = Partial<Props>,
>(
  Component: ComponentType<Props>,
  options?: TastyProps<never, never, Props>,
): ComponentType<TastyComponentPropsWithDefaults<Props, DefaultProps>>;

// Implementation
export function tasty<
  K extends StyleList,
  V extends VariantMap,
  C = Record<string, unknown>,
>(Component: any, options?: any) {
  if (typeof Component === 'string') {
    return tastyGlobal(Component as string, options as Styles);
  }

  if (isValidElementType(Component)) {
    return tastyWrap(Component as ComponentType<any>, options);
  }

  return tastyElement(Component as TastyProps<K, V>);
}

// Internal specialized implementations
function tastyGlobal(selector: string, styles?: Styles) {
  let Element = createGlobalStyle<StyledElementProps>`$(({ $css }) => $css)`;

  const _StyleDeclarationComponent: FC<GlobalTastyProps> = ({
    breakpoints,
  }) => {
    let contextBreakpoints = useContext(BreakpointsContext);

    const breakpointsList = (breakpoints ?? contextBreakpoints) || [980];
    const breakpointsHash = breakpointsList.join(',');

    let css = useMemo(() => {
      if (!styles) return '';
      return `\n{}${selector}{${renderStyles(
        styles,
        pointsToZones(breakpointsList),
      )}}`;
    }, [breakpointsHash]);

    return <Element $css={css} />;
  };

  _StyleDeclarationComponent.displayName = `TastyStyleDeclaration(${selector})`;

  return _StyleDeclarationComponent;
}

function tastyWrap<
  P extends PropsWithStyles,
  DefaultProps extends Partial<P> = Partial<P>,
>(
  Component: ComponentType<P>,
  options?: TastyProps<never, never, P>,
): ComponentType<TastyComponentPropsWithDefaults<P, DefaultProps>> {
  let {
    as: extendTag,
    element: extendElement,
    ...defaultProps
  } = (options ?? {}) as TastyProps<never, never, P>;

  let propsWithStyles = ['styles'].concat(
    Object.keys(defaultProps).filter((prop) => prop.endsWith('Styles')),
  );

  const _WrappedComponent = forwardRef<any, any>((props, ref) => {
    const { as, element, ...restProps } = props as Record<string, unknown>;
    const propsWithStylesValues = propsWithStyles.map(
      (prop) => (props as any)[prop],
    );

    const mergedStylesMap: Styles | undefined = useMemo(() => {
      return propsWithStyles.reduce((map, prop) => {
        const restValue = (restProps as any)[prop];
        const defaultValue = (defaultProps as any)[prop];

        if (restValue != null && defaultValue != null) {
          (map as any)[prop] = mergeStyles(defaultValue, restValue);
        } else {
          (map as any)[prop] = restValue ?? defaultValue;
        }

        return map;
      }, {} as Styles);
    }, [propsWithStylesValues]);

    const elementProps = {
      ...(defaultProps as unknown as Record<string, unknown>),
      ...(restProps as unknown as Record<string, unknown>),
      ...(mergedStylesMap as unknown as Record<string, unknown>),
      as: (as as string | undefined) ?? extendTag,
      element: (element as string | undefined) || extendElement,
      ref,
    } as unknown as P;

    return createElement(Component as ComponentType<P>, elementProps);
  });

  _WrappedComponent.displayName = `TastyWrappedComponent(${getDisplayName(
    Component,
    (defaultProps as any).qa ?? (extendTag as any) ?? 'Anonymous',
  )})`;

  return _WrappedComponent as unknown as ComponentType<
    TastyComponentPropsWithDefaults<P, DefaultProps>
  >;
}

function tastyElement<K extends StyleList, V extends VariantMap>(
  tastyOptions: TastyProps<K, V>,
) {
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
    type VariantFC<K extends StyleList> = ForwardRefExoticComponent<
      PropsWithoutRef<AllBasePropsWithMods<K>> & RefAttributes<unknown>
    >;

    const variantEntries = Object.entries(variants) as [string, Styles][];
    const variantComponents = variantEntries.reduce(
      (map, [variant, variantStyles]) => {
        map[variant] = tastyElement({
          as: originalAs,
          styles: mergeStyles(defaultStyles, variantStyles),
          styleProps,
          ...(defaultProps as Props),
        } as TastyProps<K, never>) as unknown as VariantFC<K>;
        return map;
      },
      {} as Record<string, VariantFC<K>>,
    );

    if (!variantComponents['default']) {
      variantComponents['default'] = tastyElement({
        as: originalAs,
        styles: defaultStyles,
        styleProps,
        ...(defaultProps as Props),
      } as TastyProps<K, never>) as unknown as VariantFC<K>;
    }

    // eslint-disable-next-line react/display-name
    _TastyComponent = forwardRef<
      unknown,
      AllBasePropsWithMods<K> & WithVariant<V>
    >((allProps, ref) => {
      const { variant, ...restProps } = allProps as WithVariant<V> &
        Record<string, unknown>;

      const Component =
        variantComponents[(variant as unknown as string) || 'default'] ??
        variantComponents['default'];

      const componentProps = restProps as unknown as PropsWithoutRef<
        AllBasePropsWithMods<K>
      >;

      const elementProps = {
        ...componentProps,
        ref,
      } as PropsWithoutRef<AllBasePropsWithMods<K>> & RefAttributes<unknown>;

      return createElement(Component, elementProps);
    });
  } else {
    let Element = styledComponents[originalAs](
      ({ $css }) => $css,
    ) as ComponentType<BaseElementProps>;

    /**
     * An additional optimization that allows to avoid rendering styles across various instances
     * of the same element if no custom styles are provided via `styles` prop or direct style props.
     */
    const renderDefaultStyles = cacheWrapper((breakpoints: number[]) =>
      renderStyles(defaultStyles || {}, pointsToZones(breakpoints)),
    );

    let {
      qa: defaultQa,
      qaVal: defaultQaVal,
      ...otherDefaultProps
    } = defaultProps ?? {};

    // eslint-disable-next-line react/display-name
    _TastyComponent = forwardRef<
      unknown,
      AllBasePropsWithMods<K> & WithVariant<V>
    >((allProps, ref) => {
      let {
        as,
        styles,
        variant: _omitVariant,
        breakpoints,
        mods,
        element,
        qa,
        qaVal,
        ...otherProps
      } = allProps as Record<string, unknown> as AllBasePropsWithMods<K> &
        WithVariant<V>;

      let propStyles: Styles | null = (
        (styleProps
          ? (styleProps as StyleList).concat(BASE_STYLES)
          : BASE_STYLES) as StyleList
      ).reduce((map, prop) => {
        const key = prop as unknown as string;
        if (Object.prototype.hasOwnProperty.call(otherProps as object, key)) {
          (map as any)[key] = (otherProps as any)[key];
          delete (otherProps as any)[key];
        }
        return map;
      }, {} as Styles);

      if (Object.keys(propStyles).length === 0) {
        propStyles = null;
      }

      if (
        !styles ||
        (styles && Object.keys(styles as Record<string, unknown>).length === 0)
      ) {
        styles = undefined as unknown as Styles;
      }

      const propStylesCacheKey = JSON.stringify(propStyles);
      const stylesCacheKey = useMemo(() => JSON.stringify(styles), [styles]);

      const useDefaultStyles = !propStyles && !styles;

      const styleCacheKey = useMemo(
        () =>
          `${styles ? JSON.stringify(styles) : ''}.${propStyles ? JSON.stringify(propStyles) : ''}`,
        [propStylesCacheKey, stylesCacheKey],
      );

      let allStyles: Styles | undefined = useMemo(
        () =>
          useDefaultStyles
            ? defaultStyles
            : mergeStyles(
                defaultStyles,
                styles as Styles,
                propStyles as Styles,
              ),
        [styleCacheKey],
      );

      let contextBreakpoints = useContext(BreakpointsContext);

      breakpoints = (breakpoints as number[] | undefined) ?? contextBreakpoints;

      let renderedStyles = useMemo(
        () =>
          useDefaultStyles
            ? renderDefaultStyles(breakpoints as number[])
            : renderStyles(allStyles, pointsToZones(breakpoints as number[])),
        [allStyles, breakpoints.join(',')],
      );

      let modProps: Record<string, unknown> | undefined;
      if (mods) {
        const modsObject = mods as unknown as Record<string, unknown>;
        modProps = modAttrs(modsObject as any) as Record<string, unknown>;
      }

      const elementProps = {
        as: (as as string | undefined) ?? originalAs,
        'data-element': (element as string | undefined) || defaultElement,
        'data-qa': (qa as string | undefined) || defaultQa,
        'data-qaval': (qaVal as string | undefined) || defaultQaVal,
        ...(otherDefaultProps as unknown as Record<string, unknown>),
        ...(otherProps as unknown as Record<string, unknown>),
        ...(modProps || {}),
        ref,
        $css: renderedStyles,
      } as BaseElementProps;

      return createElement(Element, elementProps);
    });
  }

  _TastyComponent.displayName = `TastyComponent(${
    (defaultProps as any).qa || originalAs
  })`;

  return _TastyComponent;
}

export const Element = tasty({});
