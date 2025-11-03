import {
  ComponentType,
  createElement,
  FC,
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  useContext,
  useInsertionEffect,
  useMemo,
  useRef,
} from 'react';
import { isValidElementType } from 'react-is';

import { allocateClassName, inject, injectGlobal } from './injector';
import { BreakpointsContext } from './providers/BreakpointsProvider';
import { BASE_STYLES } from './styles/list';
import { Styles, StylesInterface } from './styles/types';
import { AllBaseProps, BaseProps, BaseStyleProps, Props } from './types';
import { cacheWrapper } from './utils/cache-wrapper';
import { getDisplayName } from './utils/getDisplayName';
import { mergeStyles } from './utils/mergeStyles';
import { modAttrs } from './utils/modAttrs';
import { RenderResult, renderStyles } from './utils/renderStyles';
import { ResponsiveStyleValue, stringifyStyles } from './utils/styles';

/**
 * Mapping of is* properties to their corresponding HTML attributes
 */
const IS_PROPERTIES_MAP = {
  isDisabled: 'disabled',
  isHidden: 'hidden',
  isChecked: 'checked',
} as const;

/**
 * Precalculated entries for performance optimization
 */
const IS_PROPERTIES_ENTRIES = Object.entries(IS_PROPERTIES_MAP);

/**
 * Helper function to handle is* properties consistently
 * Transforms is* props to HTML attributes and adds corresponding data-* attributes
 */
function handleIsProperties(props: Record<string, unknown>) {
  for (const [isProperty, targetAttribute] of IS_PROPERTIES_ENTRIES) {
    if (isProperty in props) {
      props[targetAttribute] = props[isProperty];
      delete props[isProperty];
    }

    // Add data-* attribute if target attribute is truthy and doesn't already exist
    const dataAttribute = `data-${targetAttribute}`;
    if (!(dataAttribute in props) && props[targetAttribute]) {
      props[dataAttribute] = '';
    }
  }
}

/**
 * Simple hash function for internal cache keys
 */
// Generate unique cache key for style deduplication
function generateStyleCacheKey(styleKey: string, contextKey?: string): string {
  // Use null character as separator for better performance and no collision risk
  return contextKey ? `${styleKey}\0${contextKey}` : styleKey;
}

// Basic props accepted by our base element
type BaseElementProps = { as?: string } & Record<string, unknown>;

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
  const _StyleDeclarationComponent: FC<GlobalTastyProps> = ({
    breakpoints,
  }) => {
    let contextBreakpoints = useContext(BreakpointsContext);

    const breakpointsList = (breakpoints ?? contextBreakpoints) || [980];
    const disposeRef = useRef<(() => void) | null>(null);

    const styleResults = useMemo(() => {
      if (!styles) return [];
      return renderStyles(styles, breakpointsList, selector);
    }, [selector, styles, breakpointsList]);

    // Inject styles at insertion phase; cleanup on change/unmount
    useInsertionEffect(() => {
      disposeRef.current?.();
      if ((styleResults as any[]).length === 0) return;
      const { dispose } = injectGlobal(styleResults as any);
      disposeRef.current = dispose;
      return () => {
        disposeRef.current?.();
        disposeRef.current = null;
      };
    }, [styleResults]);

    return null;
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
    /**
     * An additional optimization that allows to avoid rendering styles across various instances
     * of the same element if no custom styles are provided via `styles` prop or direct style props.
     */
    const renderDefaultStyles = cacheWrapper((breakpoints: number[]) => {
      // Return rules without className - injector will add it
      return renderStyles(defaultStyles || {}, breakpoints);
    });

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
        className: userClassName,
        ...otherProps
      } = allProps as Record<string, unknown> as AllBasePropsWithMods<K> &
        WithVariant<V> & { className?: string };

      // Optimize propStyles extraction - avoid creating empty objects
      let propStyles: Styles | null = null;
      const propsToCheck = styleProps
        ? (styleProps as StyleList).concat(BASE_STYLES)
        : BASE_STYLES;

      for (const prop of propsToCheck) {
        const key = prop as unknown as string;
        if (Object.prototype.hasOwnProperty.call(otherProps as object, key)) {
          if (!propStyles) propStyles = {};
          (propStyles as any)[key] = (otherProps as any)[key];
          delete (otherProps as any)[key];
        }
      }

      if (
        !styles ||
        (styles && Object.keys(styles as Record<string, unknown>).length === 0)
      ) {
        styles = undefined as unknown as Styles;
      }

      let contextBreakpoints = useContext(BreakpointsContext);
      breakpoints = (breakpoints as number[] | undefined) ?? contextBreakpoints;

      // Memoize breakpoints key once
      const breakpointsKey = useMemo(
        () => (breakpoints as number[] | undefined)?.join(',') || '',
        [breakpoints?.join(',')],
      );

      // Optimize style computation and cache key generation
      const { allStyles, cacheKey, useDefaultStyles } = useMemo(() => {
        const hasStyles =
          styles && Object.keys(styles as Record<string, unknown>).length > 0;
        const hasPropStyles = propStyles && Object.keys(propStyles).length > 0;
        const useDefault = !hasStyles && !hasPropStyles;

        const merged = useDefault
          ? defaultStyles
          : mergeStyles(defaultStyles, styles as Styles, propStyles as Styles);

        // Generate cache key for style deduplication
        const styleKey = stringifyStyles(merged || {});
        const key = generateStyleCacheKey(
          styleKey,
          breakpointsKey ? `bp:${breakpointsKey}` : undefined,
        );

        return {
          allStyles: merged,
          cacheKey: key,
          useDefaultStyles: useDefault,
        };
      }, [styles, propStyles, breakpointsKey]);

      // Compute rules synchronously; inject via insertion effect
      const directResult: RenderResult = useMemo(() => {
        if (useDefaultStyles) {
          return renderDefaultStyles(breakpoints as number[]);
        } else if (allStyles && Object.keys(allStyles).length > 0) {
          // Return rules without className - injector will add it
          return renderStyles(allStyles, breakpoints as number[]);
        } else {
          return { rules: [], className: '' };
        }
      }, [useDefaultStyles, allStyles, breakpointsKey, cacheKey]);

      const disposeRef = useRef<(() => void) | null>(null);

      // Allocate className in render phase (safe for React Strict Mode)
      const allocatedClassName = useMemo(() => {
        if (!directResult.rules.length || !cacheKey) return '';
        const { className } = allocateClassName(cacheKey);
        return className;
      }, [directResult.rules.length, cacheKey]);

      // Inject styles in insertion effect (avoids render phase side effects)
      useInsertionEffect(() => {
        // Cleanup previous disposal reference
        disposeRef.current?.();

        if (directResult.rules.length > 0) {
          const injectionResult = inject(directResult.rules, { cacheKey });
          disposeRef.current = injectionResult.dispose;
        } else {
          disposeRef.current = null;
        }

        return () => {
          disposeRef.current?.();
          disposeRef.current = null;
        };
      }, [directResult.rules, cacheKey]);

      const injectedClassName = allocatedClassName;

      let modProps: Record<string, unknown> | undefined;
      if (mods) {
        const modsObject = mods as unknown as Record<string, unknown>;
        modProps = modAttrs(modsObject as any) as Record<string, unknown>;
      }

      // Merge user className with injected className
      const finalClassName = [
        (userClassName as string) || '',
        injectedClassName,
      ]
        .filter(Boolean)
        .join(' ');

      const elementProps = {
        'data-element': (element as string | undefined) || defaultElement,
        'data-qa': (qa as string | undefined) || defaultQa,
        'data-qaval': (qaVal as string | undefined) || defaultQaVal,
        ...(otherDefaultProps as unknown as Record<string, unknown>),
        ...(modProps || {}),
        ...(otherProps as unknown as Record<string, unknown>),
        className: finalClassName,
        ref,
      } as Record<string, unknown>;

      // Apply the helper to handle is* properties
      handleIsProperties(elementProps);

      // NEW: Use plain createElement instead of styled Element
      const renderedElement = createElement(
        (as as string | 'div') ?? originalAs,
        elementProps,
      );

      // Note: Empty className is normal for elements with no styles

      return renderedElement;
    });
  }

  _TastyComponent.displayName = `TastyComponent(${
    (defaultProps as any).qa || originalAs
  })`;

  return _TastyComponent;
}

export const Element = tasty({});
