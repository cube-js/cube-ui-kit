import styledComponents, { createGlobalStyle } from 'styled-components';
import { ComponentType, FC, forwardRef, useContext, useMemo } from 'react';
import { isValidElementType } from 'react-is';
import { BreakpointsContext } from './providers/BreakpointsProvider';
import { modAttrs } from './utils/modAttrs';
import { AllBaseProps, BaseProps, BaseStyleProps, Props } from './types';
import { renderStyles } from './utils/renderStyles';
import { pointsToZones } from './utils/responsive';
import { Styles, StylesInterface } from './styles/types';
import { BASE_STYLES } from './styles/list';
import { ResponsiveStyleValue } from './utils/styles';
import { mergeStyles } from './utils/mergeStyles';

type StyleList = readonly (keyof {
  [key in keyof StylesInterface]: StylesInterface[key];
})[];

export type TastyProps<K extends StyleList, DefaultProps = Props> = {
  /** The tag name of the element. */
  as?: string;
  /** Default styles of the element. */
  styles?: Styles;
  /** The list of styles that can be provided by props */
  styleProps?: K;
  element?: BaseProps['element'];
} & Omit<DefaultProps, 'as' | 'styles' | 'styleProps'>;

export interface GlobalTastyProps {
  breakpoints?: number[];
}

export type AllBasePropsWithMods<K extends StyleList> = AllBaseProps & {
  [key in K[number]]?: ResponsiveStyleValue<StylesInterface[key]>;
} & BaseStyleProps;

type TastyPropsWithDefaults<
  Props extends { styles?: Styles },
  DefaultProps extends Partial<Props>,
> = keyof DefaultProps extends never
  ? Props
  : {
      [key in Extract<keyof Props, keyof DefaultProps>]?: Props[key];
    } & {
      [key in keyof Omit<Props, keyof DefaultProps>]: Props[key];
    };

function tasty<K extends StyleList>(options: TastyProps<K>, secondArg?: never);
function tasty(selector: string, styles?: Styles);
function tasty<
  Props extends { styles?: Styles },
  DefaultProps extends Partial<Props> = Partial<Props>,
>(
  Component: ComponentType<Props>,
  options?: TastyProps<never, Props>,
): ComponentType<TastyPropsWithDefaults<Props, DefaultProps>>;

// Implementation
function tasty<K extends StyleList, C = Record<string, unknown>>(
  Component,
  options,
) {
  if (typeof Component === 'string') {
    let selector = Component;
    let styles = options;
    let Element = createGlobalStyle`${(css) => css}`;

    const _StyleDeclarationComponent: FC<GlobalTastyProps> = ({
      breakpoints,
    }) => {
      let contextBreakpoints = useContext(BreakpointsContext);

      breakpoints = breakpoints ?? contextBreakpoints;

      let css = useMemo(
        () =>
          styles
            ? `\n{}${selector}{${renderStyles(
                styles,
                pointsToZones(breakpoints || contextBreakpoints),
              )}}`
            : '',
        [breakpoints.join(',')],
      );

      return <Element css={css} />;
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
            map[prop] = mergeStyles(restProps[prop], defaultProps[prop]);
          } else {
            map[prop] = restProps[prop] || defaultProps[prop];
          }

          return map;
        }, {});
      }, propsWithStylesValues);

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

    _WrappedComponent.displayName = `TastyWrappedComponent(${
      Component.displayName ??
      Component.name ??
      defaultProps.qa ??
      extendTag ??
      'Anonymous'
    })`;

    return _WrappedComponent;
  }

  options = Component;

  let {
    as: originalAs = 'div',
    element: defaultElement,
    styles: defaultStyles,
    styleProps,
    ...defaultProps
  } = options;

  let Element = styledComponents[originalAs](({ css }) => css);

  let _TastyComponent = forwardRef((allProps: AllBasePropsWithMods<K>, ref) => {
    let { as, styles, breakpoints, mods, element, qa, qaVal, ...otherProps } =
      allProps;

    let {
      qa: defaultQa,
      qaVal: defaultQaVal,
      ...otherDefaultProps
    } = defaultProps ?? {};

    let propStyles: Styles = (
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

    let allStyles: Styles = useMemo(
      () => mergeStyles(defaultStyles, styles, propStyles),
      [styles, propStyles],
    );

    let contextBreakpoints = useContext(BreakpointsContext);

    breakpoints = breakpoints ?? contextBreakpoints;

    let renderedStyles = useMemo(
      () =>
        allStyles
          ? renderStyles(allStyles, pointsToZones(breakpoints as number[]))
          : '',
      [allStyles, breakpoints],
    );

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
        css={renderedStyles}
      />
    );
  });

  _TastyComponent.displayName = `TastyComponent(${
    defaultProps.qa || originalAs
  })`;

  return _TastyComponent;
}

const Element = tasty({});

export { tasty, Element };
