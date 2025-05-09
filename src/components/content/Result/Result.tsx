import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconInfoCircleFilled,
} from '@tabler/icons-react';
import { ComponentType, forwardRef, ReactNode, useMemo } from 'react';

import { WarningFilledIcon } from '../../../icons';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../../tasty';
import { mergeProps, wrapNodeIfPlain } from '../../../utils/react';
import { Title } from '../Title';

export interface CubeResultProps extends BaseProps, ContainerStyleProps {
  /** Additional block content. For example, a set of buttons */
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
  /** Whether the result component has a compact presentation */
  isCompact?: boolean;
}

export type CubeResultStatus =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 404
  | 403
  | 500;

type StatusIconMap = Record<
  CubeResultStatus,
  {
    color: string;
    component: ComponentType;
  }
>;

const Container = tasty({
  qa: 'Result_Container',
  as: 'section',
  styles: {
    display: {
      '': 'flex',
      compact: 'grid',
    },
    gridAreas: '"icon title" "content content"',
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
    },
    textAlign: {
      '': 'center',
      compact: 'left',
    },

    Icon: {
      gridArea: 'icon',
      fontSize: {
        '': '10x',
        compact: '4x',
      },
    },

    Content: {
      gridArea: 'content',
      display: 'block',
    },

    Title: {
      gridArea: 'title',
      display: 'flex',
      flow: 'column',
      placeItems: 'inherit',
      gap: '1x',
      placeSelf: 'center',
    },
  },
});

const statusIconMap: StatusIconMap = {
  success: {
    color: 'success',
    component: IconCircleCheckFilled,
  },
  error: {
    color: 'danger',
    component: IconCircleXFilled,
  },
  info: {
    color: 'purple',
    component: IconInfoCircleFilled,
  },
  warning: {
    color: 'note',
    component: WarningFilledIcon,
  },
  404: {
    color: 'purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
  },
  403: {
    color: 'purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
  },
  500: {
    color: 'purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
  },
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
    ...otherProps
  } = props;

  subtitle = subtitle ?? subTitle;

  if (icon && status) {
    console.warn(
      'Don\'t use "icon" and "status" together, it can lead to possible errors.',
    );
  }

  const iconNode = useMemo(() => {
    if (icon) {
      return icon;
    }

    const { color, component: Component } =
      status && statusIconMap.hasOwnProperty(status)
        ? statusIconMap[status]
        : statusIconMap.info;

    return (
      <div data-element="Icon" style={{ color: `var(--${color}-color)` }}>
        <Component data-element="Icon" />
      </div>
    );
  }, [icon, status]);

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <Container
      {...mergeProps(filterBaseProps(otherProps, { eventProps: true }), {
        mods: { compact: isCompact },
      })}
      ref={ref}
      styles={styles}
    >
      {iconNode}
      {(title || subtitle) && (
        <div data-element="Title">
          {wrapNodeIfPlain(title, () => (
            <Title level={2} preset={isCompact ? 'h5' : 'h4'}>
              {title}
            </Title>
          ))}
          {wrapNodeIfPlain(subtitle, () => (
            <Title level={3} preset={isCompact ? 't3m' : 't2m'}>
              {subtitle}
            </Title>
          ))}
        </div>
      )}
      {children && <div data-element="Content">{children}</div>}
    </Container>
  );
}

const _Result = forwardRef(Result);

_Result.displayName = 'Result';

export { _Result as Result };
