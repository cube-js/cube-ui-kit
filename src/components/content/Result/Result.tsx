import { ComponentType, forwardRef, ReactNode, useMemo } from 'react';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  InfoCircleFilled,
  WarningFilled,
} from '@ant-design/icons';

import { Title } from '../Title';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../../tasty';
import { wrapNodeIfPlain } from '../../../utils/react';

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
    display: 'flex',
    flow: 'column',
    placeItems: 'center',
    gap: '3x',
    padding: '6x 4x',
    textAlign: 'center',

    Content: {
      display: 'block',
    },

    Title: {
      display: 'flex',
      flow: 'column',
      placeItems: 'inherit',
      gap: '1x',
    },
  },
});

const IconWrapper = tasty({
  styles: {
    fontSize: '10x',
  },
});

const statusIconMap: StatusIconMap = {
  success: {
    color: '#success',
    component: CheckCircleFilled,
  },
  error: {
    color: '#danger',
    component: CloseCircleFilled,
  },
  info: {
    color: '#purple',
    component: InfoCircleFilled,
  },
  warning: {
    color: '#note',
    component: WarningFilled,
  },
  404: {
    color: '#purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
  },
  403: {
    color: '#purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
  },
  500: {
    color: '#purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
  },
};

function Result(props: CubeResultProps, ref) {
  let { children, icon, status, subTitle, subtitle, title, ...otherProps } =
    props;

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
      <IconWrapper data-element="IconWrapper" styles={{ color }}>
        <Component data-element="Icon" />
      </IconWrapper>
    );
  }, [icon, status]);

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <Container
      {...filterBaseProps(otherProps, { eventProps: true })}
      ref={ref}
      styles={styles}
    >
      {iconNode}
      {(title || subtitle) && (
        <div data-element="Title">
          {wrapNodeIfPlain(title, () => (
            <Title level={2} preset="h4">
              {title}
            </Title>
          ))}
          {wrapNodeIfPlain(subtitle, () => (
            <Title level={3} preset="t2m">
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

export { _Result as Result };
