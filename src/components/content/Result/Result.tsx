import { ComponentType, forwardRef, ReactNode, useMemo } from 'react';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  InfoCircleFilled,
  WarningFilled,
} from '@ant-design/icons';

import { Title } from '../Title';
import { styled } from '../../../styled';
import { CONTAINER_STYLES } from '../../../styles/list';
import { BaseProps, ContainerStyleProps } from '../../types';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { extractStyles } from '../../../utils/styles';
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
  /** The subTitle */
  subTitle?: ReactNode;
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

const Container = styled({
  name: 'ResultContainer',
  tag: 'section',
  styles: {
    display: 'flex',
    flow: 'column',
    placeItems: 'center',
    gap: '3x',
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

const IconWrapper = styled({
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

export const Result = forwardRef<HTMLElement, CubeResultProps>((props, ref) => {
  const { children, icon, status, subTitle, title, ...otherProps } = props;

  if (icon && status) {
    console.warn(
      'Don\'t use "icon" and "status" together, it can lead to possible errors.',
    );
  }

  const iconNode = useMemo(() => {
    if (icon) {
      return icon;
    }

    const { color, component: Component }
      = status && statusIconMap.hasOwnProperty(status)
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
      {(title || subTitle) && (
        <div data-element="Title">
          {wrapNodeIfPlain(title, () => (
            <Title level={2} preset="h4">
              {title}
            </Title>
          ))}
          {wrapNodeIfPlain(subTitle, () => (
            <Title level={3} preset="h5m">
              {subTitle}
            </Title>
          ))}
        </div>
      )}
      {children && <div data-element="Content">{children}</div>}
    </Container>
  );
});

Result.displayName = 'Result';
