import {
  ForwardedRef,
  forwardRef,
  Fragment,
  HTMLAttributes,
  ReactNode,
  Ref,
  RefCallback,
} from 'react';

import { SlashIcon } from '../../../icons/SlashIcon';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../../tasty';
import { Link } from '../../actions/Link/Link';
import { Text } from '../Text';
import { useAutoTooltip } from '../use-auto-tooltip';

import { LayoutContextReset } from './LayoutContext';

const HeaderElement = tasty({
  as: 'header',
  qa: 'LayoutHeader',
  styles: {
    display: 'grid',
    gridTemplate: `
      "breadcrumbs breadcrumbs breadcrumbs" auto
      "title suffix extra" 1fr
      "subtitle subtitle extra" auto
      / max-content 1fr minmax(0, auto)
    `,
    gap: 0,
    padding: '($content-padding, 1x)',
    border: 'bottom',
    width: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    placeContent: 'stretch',
    placeItems: 'center stretch',

    Breadcrumbs: {
      gridArea: 'breadcrumbs',
      display: 'flex',
      flow: 'row nowrap',
      placeItems: 'center start',
      gap: '0.5x',
      preset: 't3',
      color: '#dark-02',
    },

    Title: {
      gridArea: 'title',
      preset: {
        '': 'h3',
        'level=1': 'h1',
        'level=2': 'h2',
        'level=3': 'h3',
        'level=4': 'h4',
        'level=5': 'h5',
        'level=6': 'h6',
      },
      color: '#dark',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    Suffix: {
      gridArea: 'suffix',
      display: 'flex',
      placeItems: 'center',
    },

    Extra: {
      gridArea: 'extra',
      display: 'flex',
      placeItems: 'center',
      placeSelf: 'end',
      gap: '1x',
      width: 'max 100%',
    },

    Subtitle: {
      gridArea: 'subtitle',
      preset: 't3',
      color: '#dark-02',
    },
  },
});

export interface CubeLayoutHeaderProps extends BaseProps, ContainerStyleProps {
  /** Page/section title */
  title?: ReactNode;
  /** Title heading level (1-6) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Content next to the title */
  suffix?: ReactNode;
  /** Content on the right side */
  extra?: ReactNode;
  /** Text below the title */
  subtitle?: ReactNode;
  /**
   * Navigation breadcrumbs (max 3 items recommended).
   * Uses Link component which integrates with the navigation provider.
   */
  breadcrumbs?: Array<[label: string, href: string]>;
  children?: ReactNode;
}

function LayoutHeader(
  props: CubeLayoutHeaderProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const {
    title,
    level = 3,
    suffix,
    extra,
    subtitle,
    breadcrumbs,
    children,
    mods,
    ...otherProps
  } = props;

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  // Use auto tooltip for title overflow detection
  const { labelRef, renderWithTooltip } = useAutoTooltip({
    tooltip: true,
    children: typeof title === 'string' ? title : undefined,
  });

  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

  const renderBreadcrumbs = () => {
    if (!hasBreadcrumbs) return null;

    return (
      <div data-element="Breadcrumbs">
        {breadcrumbs.map(([label, href], index) => (
          <Fragment key={href}>
            <Link to={href}>{label}</Link>
            <SlashIcon />
          </Fragment>
        ))}
        {typeof title === 'string' && <Text color="#dark-02">{title}</Text>}
      </div>
    );
  };

  const renderTitle = (
    tooltipProps?: HTMLAttributes<HTMLElement>,
    tooltipRef?: Ref<HTMLElement>,
  ) => {
    if (!title) return null;

    const TitleTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

    return (
      <TitleTag
        ref={tooltipRef as Ref<HTMLHeadingElement>}
        data-element="Title"
        data-level={level}
        {...tooltipProps}
      >
        <span ref={labelRef as RefCallback<HTMLSpanElement>}>{title}</span>
      </TitleTag>
    );
  };

  return (
    <HeaderElement
      ref={ref}
      {...filterBaseProps(otherProps, { eventProps: true })}
      mods={{ ...mods, level }}
      styles={styles}
    >
      <LayoutContextReset>
        {renderBreadcrumbs()}
        {renderWithTooltip(renderTitle, 'bottom')}
        {suffix && <div data-element="Suffix">{suffix}</div>}
        {extra && <div data-element="Extra">{extra}</div>}
        {subtitle && <div data-element="Subtitle">{subtitle}</div>}
        {children}
      </LayoutContextReset>
    </HeaderElement>
  );
}

const _LayoutHeader = forwardRef(LayoutHeader);

_LayoutHeader.displayName = 'Layout.Header';

export { _LayoutHeader as LayoutHeader };
