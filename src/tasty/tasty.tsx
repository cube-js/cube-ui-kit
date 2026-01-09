import {
  AllHTMLAttributes,
  ComponentType,
  createElement,
  forwardRef,
  ForwardRefExoticComponent,
  JSX,
  PropsWithoutRef,
  RefAttributes,
  useMemo,
} from 'react';
import { isValidElementType } from 'react-is';

import { useStyles } from './hooks/useStyles';
import { BASE_STYLES } from './styles/list';
import { Styles, StylesInterface } from './styles/types';
import {
  AllBaseProps,
  BaseProps,
  BaseStyleProps,
  Mods,
  Props,
  Tokens,
} from './types';
import { getDisplayName } from './utils/getDisplayName';
import { mergeStyles } from './utils/mergeStyles';
import { modAttrs } from './utils/modAttrs';
import { processTokens, stringifyTokens } from './utils/processTokens';

import type { StyleValue, StyleValueStateMap } from './utils/styles';

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

// Basic props accepted by our base element
type BaseElementProps = { as?: string } & Record<string, unknown>;

/**
 * Creates a sub-element component for compound component patterns.
 * Sub-elements are lightweight components with data-element attribute for CSS targeting.
 */
function createSubElement<Tag extends keyof JSX.IntrinsicElements>(
  elementName: string,
  definition: SubElementDefinition<Tag>,
): ForwardRefExoticComponent<
  PropsWithoutRef<SubElementProps<Tag>> & RefAttributes<unknown>
> {
  // Normalize definition to object form
  const config =
    typeof definition === 'string'
      ? { as: definition as Tag }
      : (definition as { as?: Tag; qa?: string; qaVal?: string | number });

  const tag = config.as ?? ('div' as Tag);
  const defaultQa = config.qa;
  const defaultQaVal = config.qaVal;

  const SubElement = forwardRef<unknown, SubElementProps<Tag>>((props, ref) => {
    const {
      qa,
      qaVal,
      mods,
      tokens,
      isDisabled,
      isHidden,
      isChecked,
      className,
      style,
      ...htmlProps
    } = props as SubElementProps<Tag> & {
      className?: string;
      style?: Record<string, unknown>;
    };

    // Build mod attributes
    let modProps: Record<string, unknown> | undefined;
    if (mods) {
      modProps = modAttrs(mods as Mods) as Record<string, unknown>;
    }

    // Process tokens into inline style properties
    const tokenStyle = tokens
      ? (processTokens(tokens) as Record<string, unknown>)
      : undefined;

    // Merge token styles with explicit style prop (style has priority)
    let mergedStyle: Record<string, unknown> | undefined;
    if (tokenStyle || style) {
      mergedStyle =
        tokenStyle && style
          ? { ...tokenStyle, ...style }
          : ((tokenStyle ?? style) as Record<string, unknown>);
    }

    const elementProps = {
      'data-element': elementName,
      'data-qa': qa ?? defaultQa,
      'data-qaval': qaVal ?? defaultQaVal,
      ...(modProps || {}),
      ...htmlProps,
      className,
      style: mergedStyle,
      isDisabled,
      isHidden,
      isChecked,
      ref,
    } as Record<string, unknown>;

    // Handle is* properties (isDisabled -> disabled + data-disabled, etc.)
    handleIsProperties(elementProps);

    // Clean up undefined data attributes
    if (elementProps['data-qa'] === undefined) delete elementProps['data-qa'];
    if (elementProps['data-qaval'] === undefined)
      delete elementProps['data-qaval'];

    return createElement(tag, elementProps);
  });

  SubElement.displayName = `SubElement(${elementName})`;

  return SubElement as ForwardRefExoticComponent<
    PropsWithoutRef<SubElementProps<Tag>> & RefAttributes<unknown>
  >;
}

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

// ============================================================================
// Sub-element types for compound components
// ============================================================================

/**
 * Definition for a sub-element. Can be either:
 * - A tag name string (e.g., 'div', 'span')
 * - An object with configuration options
 */
export type SubElementDefinition<
  Tag extends keyof JSX.IntrinsicElements = 'div',
> =
  | Tag
  | {
      as?: Tag;
      qa?: string;
      qaVal?: string | number;
    };

/**
 * Map of sub-element definitions.
 * Keys become the sub-component names (e.g., { Icon: 'span' } -> Component.Icon)
 */
export type ElementsDefinition = Record<
  string,
  SubElementDefinition<keyof JSX.IntrinsicElements>
>;

/**
 * Resolves the tag from a SubElementDefinition
 */
type ResolveElementTag<T extends SubElementDefinition<any>> = T extends string
  ? T
  : T extends { as?: infer Tag }
    ? Tag extends keyof JSX.IntrinsicElements
      ? Tag
      : 'div'
    : 'div';

/**
 * Props for sub-element components.
 * Combines HTML attributes with tasty-specific props (qa, qaVal, mods, tokens, isDisabled, etc.)
 */
export type SubElementProps<Tag extends keyof JSX.IntrinsicElements = 'div'> =
  Omit<
    JSX.IntrinsicElements[Tag],
    'ref' | 'color' | 'content' | 'translate'
  > & {
    qa?: string;
    qaVal?: string | number;
    mods?: Mods;
    tokens?: Tokens;
    isDisabled?: boolean;
    isHidden?: boolean;
    isChecked?: boolean;
  };

/**
 * Generates the sub-element component types from an ElementsDefinition
 */
type SubElementComponents<E extends ElementsDefinition> = {
  [K in keyof E]: ForwardRefExoticComponent<
    PropsWithoutRef<SubElementProps<ResolveElementTag<E[K]>>> &
      RefAttributes<
        ResolveElementTag<E[K]> extends keyof HTMLElementTagNameMap
          ? HTMLElementTagNameMap[ResolveElementTag<E[K]>]
          : Element
      >
  >;
};

/**
 * Base type containing common properties shared between TastyProps and TastyElementOptions.
 * Separated to avoid code duplication while allowing different type constraints.
 */
type TastyBaseProps<
  K extends StyleList,
  V extends VariantMap,
  E extends ElementsDefinition = {},
> = {
  /** Default styles of the element. */
  styles?: Styles;
  /** The list of styles that can be provided by props */
  styleProps?: K;
  element?: BaseProps['element'];
  variants?: V;
  /** Default tokens for inline CSS custom properties */
  tokens?: Tokens;
  /** Sub-element definitions for compound components */
  elements?: E;
} & Pick<BaseProps, 'qa' | 'qaVal'> &
  WithVariant<V>;

export type TastyProps<
  K extends StyleList,
  V extends VariantMap,
  E extends ElementsDefinition = {},
  DefaultProps = Props,
> = TastyBaseProps<K, V, E> & {
  /** The tag name of the element or a React component. */
  as?: string | ComponentType<any>;
} & Partial<Omit<DefaultProps, 'as' | 'styles' | 'styleProps' | 'tokens'>>;

/**
 * TastyElementOptions is used for the element-creation overload of tasty().
 * It includes a Tag generic that allows TypeScript to infer the correct
 * HTML element type from the `as` prop.
 *
 * Note: Uses a separate index signature with `unknown` instead of inheriting
 * from Props (which has `any`) to ensure strict type checking for styles.
 */
export type TastyElementOptions<
  K extends StyleList,
  V extends VariantMap,
  E extends ElementsDefinition = {},
  Tag extends keyof JSX.IntrinsicElements = 'div',
> = TastyBaseProps<K, V, E> & {
  /** The tag name of the element or a React component. */
  as?: Tag | ComponentType<any>;
} & {
  /** Allow additional props without polluting style type checking */
  [key: string]: unknown;
};

export type AllBasePropsWithMods<K extends StyleList> = AllBaseProps & {
  [key in K[number]]?:
    | StyleValue<StylesInterface[key]>
    | StyleValueStateMap<StylesInterface[key]>;
} & BaseStyleProps;

/**
 * Keys from BasePropsWithoutChildren that should be omitted from HTML attributes.
 * This excludes event handlers so they can be properly typed from JSX.IntrinsicElements.
 */
type TastySpecificKeys =
  | 'as'
  | 'qa'
  | 'qaVal'
  | 'element'
  | 'styles'
  | 'breakpoints'
  | 'block'
  | 'inline'
  | 'mods'
  | 'isHidden'
  | 'isDisabled'
  | 'css'
  | 'style'
  | 'theme'
  | 'tokens'
  | 'ref'
  | 'color';

/**
 * Props type for tasty elements that combines:
 * - AllBasePropsWithMods for style props with strict tokens type
 * - HTML attributes for flexibility (properly typed based on tag)
 * - Variant support
 *
 * Uses AllHTMLAttributes as base for common attributes (like disabled),
 * but overrides event handlers with tag-specific types from JSX.IntrinsicElements.
 */
export type TastyElementProps<
  K extends StyleList,
  V extends VariantMap,
  Tag extends keyof JSX.IntrinsicElements = 'div',
> = AllBasePropsWithMods<K> &
  WithVariant<V> &
  Omit<
    Omit<AllHTMLAttributes<HTMLElement>, keyof JSX.IntrinsicElements[Tag]> &
      JSX.IntrinsicElements[Tag],
    TastySpecificKeys | K[number]
  >;

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

export function tasty<
  K extends StyleList,
  V extends VariantMap,
  E extends ElementsDefinition = {},
  Tag extends keyof JSX.IntrinsicElements = 'div',
>(
  options: TastyElementOptions<K, V, E, Tag>,
  secondArg?: never,
): ForwardRefExoticComponent<
  PropsWithoutRef<TastyElementProps<K, V, Tag>> & RefAttributes<unknown>
> &
  SubElementComponents<E>;
export function tasty<
  Props extends PropsWithStyles,
  DefaultProps extends Partial<Props> = Partial<Props>,
>(
  Component: ComponentType<Props>,
  options?: TastyProps<never, never, {}, Props>,
): ComponentType<TastyComponentPropsWithDefaults<Props, DefaultProps>>;

// Implementation
export function tasty<
  K extends StyleList,
  V extends VariantMap,
  C = Record<string, unknown>,
>(Component: any, options?: any) {
  if (isValidElementType(Component)) {
    return tastyWrap(Component as ComponentType<any>, options);
  }

  return tastyElement(Component as TastyProps<K, V>);
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

function tastyElement<
  K extends StyleList,
  V extends VariantMap,
  E extends ElementsDefinition,
>(tastyOptions: TastyProps<K, V, E>) {
  let {
    as: originalAs = 'div',
    element: defaultElement,
    styles: defaultStyles,
    styleProps,
    variants,
    tokens: defaultTokens,
    elements,
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
          tokens: defaultTokens,
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
        tokens: defaultTokens,
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
        mods,
        element,
        qa,
        qaVal,
        className: userClassName,
        tokens,
        style,
        ...otherProps
      } = allProps as Record<string, unknown> as AllBasePropsWithMods<K> &
        WithVariant<V> & {
          className?: string;
          tokens?: Tokens;
          style?: Record<string, unknown>;
        };

      // Optimize propStyles extraction - avoid creating empty objects
      let propStyles: Styles | null = null;
      const propsToCheck = styleProps
        ? (styleProps as StyleList).concat(BASE_STYLES)
        : BASE_STYLES;

      for (const prop of propsToCheck) {
        const key = prop as unknown as string;

        if (!propStyles) propStyles = {};

        if (key in otherProps) {
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

      // Merge default styles with instance styles and prop styles
      const allStyles = useMemo(() => {
        const hasStyles =
          styles && Object.keys(styles as Record<string, unknown>).length > 0;
        const hasPropStyles = propStyles && Object.keys(propStyles).length > 0;

        if (!hasStyles && !hasPropStyles) {
          return defaultStyles;
        }

        return mergeStyles(
          defaultStyles,
          styles as Styles,
          propStyles as Styles,
        );
      }, [styles, propStyles]);

      // Use the useStyles hook for style generation and injection
      const { className: stylesClassName } = useStyles({ styles: allStyles });

      // Merge default tokens with instance tokens (instance overrides defaults)
      const tokensKey = stringifyTokens(tokens as Tokens | undefined);
      const mergedTokens = useMemo(() => {
        if (!defaultTokens && !tokens) return undefined;
        if (!defaultTokens) return tokens as Tokens;
        if (!tokens) return defaultTokens;
        return { ...defaultTokens, ...tokens } as Tokens;
      }, [tokensKey]);

      // Process merged tokens into inline style properties
      const processedTokenStyle = useMemo(() => {
        return processTokens(mergedTokens);
      }, [mergedTokens]);

      // Merge processed tokens with explicit style prop (style has priority)
      const mergedStyle = useMemo(() => {
        if (!processedTokenStyle && !style) return undefined;
        if (!processedTokenStyle) return style;
        if (!style) return processedTokenStyle;
        return { ...processedTokenStyle, ...style };
      }, [processedTokenStyle, style]);

      let modProps: Record<string, unknown> | undefined;
      if (mods) {
        const modsObject = mods as unknown as Record<string, unknown>;
        modProps = modAttrs(modsObject as any) as Record<string, unknown>;
      }

      // Merge user className with generated className
      const finalClassName = [(userClassName as string) || '', stylesClassName]
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
        style: mergedStyle,
        ref,
      } as Record<string, unknown>;

      // Apply the helper to handle is* properties
      handleIsProperties(elementProps);

      const renderedElement = createElement(
        (as as string | 'div') ?? originalAs,
        elementProps,
      );

      return renderedElement;
    });
  }

  _TastyComponent.displayName = `TastyComponent(${
    (defaultProps as any).qa || originalAs
  })`;

  // Attach sub-element components if elements are defined
  if (elements) {
    const subElements = Object.entries(elements).reduce(
      (acc, [name, definition]) => {
        acc[name] = createSubElement(
          name,
          definition as SubElementDefinition<keyof JSX.IntrinsicElements>,
        );
        return acc;
      },
      {} as Record<string, ForwardRefExoticComponent<any>>,
    );

    return Object.assign(_TastyComponent, subElements);
  }

  return _TastyComponent;
}

export const Element = tasty({});
