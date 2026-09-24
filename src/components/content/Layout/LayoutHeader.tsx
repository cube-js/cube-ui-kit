import { IconArrowLeft } from '@tabler/icons-react';
import { tasty } from '@tenphi/tasty';
import {
  ForwardedRef,
  forwardRef,
  Fragment,
  HTMLAttributes,
  ReactNode,
  useMemo,
  useRef,
} from 'react';

import { useI18n } from '../../../i18n';
import { SlashIcon } from '../../../icons/SlashIcon';
import { Button } from '../../actions/Button/Button';
import { Link } from '../../actions/Link/Link';
import { useAutoTooltip } from '../use-auto-tooltip';

import { CubeLayoutContentProps, LayoutContent } from './LayoutContent';

const HeaderElement = tasty(LayoutContent, {
  as: 'header',
  qa: 'LayoutHeader',
  styles: {
    container: 'none',
    // Header always has bottom border (inherent style)
    border: 'bottom',
    flexShrink: 0,
    flexGrow: 0,
    height: 'min 6x',

    Inner: {
      $: '>',
      display: 'grid',
      gridTemplate: `
        "breadcrumbs breadcrumbs breadcrumbs extra" auto
        "back title suffix extra" max-content
        ".. subtitle subtitle extra" auto
        / auto minmax(0, max-content) 1fr minmax(0, auto)
      `,
      gap: 0,
      placeContent: 'center stretch',
      placeItems: 'center stretch',
      padding: '0 ($content-padding, 1x)',
      placeSelf: 'center stretch',
    },

    Back: {
      $: '> Inner >',
      gridArea: 'back',
      display: 'flex',
      placeItems: 'center',
      margin: '.5x right',
    },

    Breadcrumbs: {
      $: '> Inner >',
      gridArea: 'breadcrumbs',
      display: 'flex',
      flow: 'row nowrap',
      placeItems: 'center start',
      gap: '1bw',
      preset: 't3 / strong',
      color: '#dark-02',
    },

    Title: {
      $: '> Inner >',
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
      lineHeight: 'normal',
      color: '#dark',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    Suffix: {
      $: '> Inner >',
      gridArea: 'suffix',
      display: 'flex',
      placeItems: 'center',
    },

    Extra: {
      $: '> Inner >',
      gridArea: 'extra',
      display: 'flex',
      placeItems: 'center',
      placeSelf: 'center',
      gap: '1x',
      width: 'max 100%',
    },

    Subtitle: {
      $: '> Inner >',
      gridArea: 'subtitle',
      preset: 't3',
      color: '#dark-02',
    },
  },
});

export interface CubeLayoutHeaderProps extends CubeLayoutContentProps {
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
  /** Callback for the back button. When provided, a back arrow button is rendered to the left of the title. */
  onBack?: () => void;
}

function LayoutHeader(
  props: CubeLayoutHeaderProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { t } = useI18n();

  const {
    title,
    level = 3,
    suffix,
    extra,
    subtitle,
    breadcrumbs,
    onBack,
    scrollbar = 'tiny',
    children,
    mods,
    ...otherProps
  } = props;

  // Use auto tooltip for title overflow detection. The heading is what clips
  // (`overflow: hidden` + ellipsis), so it is both the element measured and
  // the tooltip's anchor — one stable ref for the two, rather than a ref merged
  // afresh on every render, which would re-attach the measuring ref (and
  // rebuild its ResizeObserver) each time the header rendered.
  const titleRef = useRef<HTMLElement>(null!);
  const titleTooltip = useMemo(() => ({ targetRef: titleRef }), []);
  const { labelRef, renderWithTooltip } = useAutoTooltip({
    tooltip: titleTooltip,
    children: typeof title === 'string' ? title : undefined,
    labelRef: titleRef,
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
      </div>
    );
  };

  const renderTitle = (tooltipProps?: HTMLAttributes<HTMLElement>) => {
    if (!title) return null;

    const TitleTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

    // Measured on the heading itself: an inline wrapper around the text
    // reports a `clientWidth` of 0 and could never read as truncated.
    return (
      <TitleTag
        ref={labelRef}
        data-element="Title"
        data-level={level}
        {...tooltipProps}
      >
        {title}
      </TitleTag>
    );
  };

  return (
    <HeaderElement
      {...otherProps}
      ref={ref}
      mods={{ ...mods, level }}
      scrollbar={scrollbar}
    >
      {renderBreadcrumbs()}
      {onBack && (
        <div data-element="Back">
          <Button
            type="clear"
            icon={<IconArrowLeft />}
            aria-label={t('layout.goBack', 'Go back')}
            onPress={onBack}
          />
        </div>
      )}
      {renderWithTooltip(renderTitle, 'bottom')}
      {suffix && <div data-element="Suffix">{suffix}</div>}
      {extra && <div data-element="Extra">{extra}</div>}
      {subtitle && <div data-element="Subtitle">{subtitle}</div>}
      {children}
    </HeaderElement>
  );
}

const _LayoutHeader = forwardRef(LayoutHeader);

_LayoutHeader.displayName = 'Layout.Header';

export { _LayoutHeader as LayoutHeader };
