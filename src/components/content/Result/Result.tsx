import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconInfoCircleFilled,
} from '@tabler/icons-react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  tasty,
} from '@tenphi/tasty';
import { ComponentType, forwardRef, ReactNode, useMemo } from 'react';

import { mergeProps, wrapNodeIfPlain } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { Title } from '../Title';

export interface CubeResultProps extends BaseProps, ContainerStyleProps {
  /** Free content between the text and the actions, e.g. an alert or details */
  children?: ReactNode;
  /** Custom icon element */
  icon?: ReactNode;
  /**
   * Result status from ready-made templates
   * @default 'info'
   */
  status?: CubeResultStatus;
  /**
   * The subTitle
   * @deprecated The subTitle prop is deprecated and will be removed in next major release. consider using subtitle instead
   */
  subTitle?: ReactNode;
  /**
   * Subtitle of the Result component
   */
  subtitle?: ReactNode;
  /** The title */
  title?: ReactNode;
  /** A prominent value shown between the title and the subtitle, e.g. an amount with currency */
  value?: ReactNode;
  /** Action buttons. A centered row by default, a stacked full-width column in the `large` size */
  actions?: ReactNode;
  /**
   * Visual scale. `large` is the dialog card: bigger icon and title, stacked full-width actions
   * @default 'medium'
   */
  size?: CubeResultSize;
  /** Whether the result component has a compact presentation */
  isCompact?: boolean;
}

export type CubeResultSize = 'medium' | 'large';

export type CubeResultStatus =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 404
  | 403
  | 500;

type StatusIconMap = Record<CubeResultStatus, ComponentType>;

const Container = tasty({
  qa: 'ResultContainer',
  as: 'section',
  styles: {
    display: {
      '': 'flex',
      compact: 'grid',
    },
    gridAreas: '"icon title" "content content" "actions actions"',
    flow: 'column',
    placeContent: {
      '': 'center',
      compact: 'start',
    },
    placeItems: {
      '': 'center',
      compact: 'start',
    },
    gap: {
      '': '3x',
      compact: '2x 1x',
    },
    padding: {
      '': '6x 4x',
      compact: '0',
      'size=large': '3x 1x',
    },
    textAlign: {
      '': 'center',
      compact: 'left',
    },
    width: 'max 80ch',
    margin: {
      '': '0 auto',
      compact: '0',
    },
    '--icon-size': {
      '': '6x',
      'size=large': '10x',
    },

    Icon: {
      $: '>',
      display: 'grid',
      gridArea: 'icon',
      color: {
        '': '#purple-icon',
        'status=success': '#success-icon',
        'status=error': '#danger-icon',
        'status=warning': '#warning-icon',
      },
    },

    Title: {
      $: '>',
      gridArea: 'title',
      display: 'flex',
      flow: 'column',
      placeItems: 'inherit',
      gap: '1x',
      placeSelf: 'center',
      textWrap: 'balance',
    },

    Value: {
      color: '#dark',
      preset: {
        '': 'h3',
        compact: 'h4',
        'size=large': 'h2',
      },
      fontVariantNumeric: 'tabular-nums',
    },

    Content: {
      $: '>',
      gridArea: 'content',
      display: 'block',
      placeSelf: {
        '': 'auto',
        'size=large': 'stretch',
      },
    },

    Actions: {
      $: '>',
      gridArea: 'actions',
      display: 'flex',
      flow: {
        '': 'row wrap',
        'size=large': 'column',
      },
      gap: '1x',
      placeContent: {
        '': 'center',
        compact: 'start',
      },
      placeItems: {
        '': 'center',
        'size=large': 'stretch',
      },
      placeSelf: {
        '': 'auto',
        'size=large': 'stretch',
      },
    },
  },
});

const statusIconMap: StatusIconMap = {
  success: () => <IconCircleCheckFilled />,
  error: () => <IconCircleXFilled />,
  info: () => <IconInfoCircleFilled />,
  warning: () => <IconAlertTriangleFilled />,
  // TODO: Needs to be implemented in the future
  404: () => null,
  403: () => null,
  500: () => null,
};

function Result(props: CubeResultProps, ref) {
  let {
    children,
    isCompact,
    icon,
    status,
    subTitle,
    subtitle,
    title,
    value,
    actions,
    size = 'medium',
    ...otherProps
  } = props;

  subtitle = subtitle ?? subTitle;

  if (icon && status) {
    console.warn(
      'Don\'t use "icon" and "status" together, it can lead to possible errors.',
    );
  }

  const isLarge = size === 'large';

  const iconNode = useMemo(() => {
    if (icon) {
      return icon;
    }

    const Component =
      status && statusIconMap.hasOwnProperty(status)
        ? statusIconMap[status]
        : statusIconMap.info;

    return (
      <div data-element="Icon">
        <Component />
      </div>
    );
  }, [icon, status]);

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <Container
      {...mergeProps(filterBaseProps(otherProps, { eventProps: true }), {
        mods: { compact: isCompact, size, status: status ?? 'info' },
      })}
      ref={ref}
      styles={styles}
    >
      {iconNode}
      {(title || value != null || subtitle) && (
        <div data-element="Title">
          {wrapNodeIfPlain(title, () => (
            <Title level={2} preset={isCompact ? 'h5' : isLarge ? 'h2' : 'h4'}>
              {title}
            </Title>
          ))}
          {value != null && <div data-element="Value">{value}</div>}
          {wrapNodeIfPlain(subtitle, () => (
            <Title
              // A name no provider defines: the dialog `title` slot must reach
              // the title only, or both headings get the dialog's label id
              slot="subtitle"
              level={3}
              preset={isCompact ? 't3m' : isLarge ? 't2' : 't2m'}
              color={isLarge ? '#dark-02' : undefined}
            >
              {subtitle}
            </Title>
          ))}
        </div>
      )}
      {children && <div data-element="Content">{children}</div>}
      {actions && <div data-element="Actions">{actions}</div>}
    </Container>
  );
}

const _Result = forwardRef(Result);

_Result.displayName = 'Result';

export { _Result as Result };
