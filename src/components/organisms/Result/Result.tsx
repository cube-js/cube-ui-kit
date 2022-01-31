import { ComponentType, forwardRef, ReactNode, useMemo } from 'react';
import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled, WarningFilled } from '@ant-design/icons';

import { Base } from '../../Base';
import { Block } from '../../Block';
import { CubeFlexProps, Flex } from '../../layout/Flex';
import { Paragraph } from '../../content/Paragraph';
import { Title } from '../../content/Title';

export interface CubeResultProps extends CubeFlexProps {
  /** The description text */
  description?: ReactNode;
  /** Operating area */
  extra?: ReactNode;
  /** Custom back icon */
  icon?: ReactNode;
  /**
   * Result status, decide icons and colors
   * @default 'info'
   */
  status?: CubeResultStatus;
  /** The title text */
  title?: ReactNode;
}

export type CubeResultStatus = 'success' | 'error' | 'info' | 'warning' | 404 | 403 | 500;

type StatusIconMap = Record<CubeResultStatus, {
  color: string;
  component: ComponentType;
  size: string;
}>;

const statusIconMap: StatusIconMap = {
  success: {
    color: '#success',
    component: CheckCircleFilled,
    size: '12x',
  },
  error: {
    color: '#danger',
    component: CloseCircleFilled,
    size: '12x',
  },
  info: {
    color: '#purple',
    component: InfoCircleFilled,
    size: '12x',
  },
  warning: {
    color: '#danger',
    component: WarningFilled,
    size: '12x',
  },
  404: {
    color: '#purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
    size: '12x',
  },
  403: {
    color: '#purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
    size: '12x',
  },
  500: {
    color: '#purple',
    component: () => {
      // TODO: Needs to be implemented in the future
      return null;
    },
    size: '12x',
  },
};

export const Result = forwardRef<HTMLElement, CubeResultProps>((props, ref) => {
  const {
    description,
    extra,
    icon,
    status,
    title,
    ...otherProps
  } = props;

  const iconNode = useMemo(() => {
    if (icon) {
      return icon;
    }

    const { color, component: Component, size: fontSize } =
      status && statusIconMap.hasOwnProperty(status)
        ? statusIconMap[status]
        : statusIconMap.info;

    return (
      <Base styles={{ color, fontSize }}>
        <Component />
      </Base>
    );
  }, [icon, status]);

  return (
    <Flex
      flow="column"
      placeItems="center"
      gap="4x"
      ref={ref}
      {...otherProps}
    >
      {iconNode}
      {(title || description) && (
        <Block
          gap="1x"
          textAlign="center"
        >
          {title && (
            <Title level={2}>
              {title}
            </Title>
          )}
          {description && (
            <Paragraph>
              {description}
            </Paragraph>
          )}
        </Block>
      )}
      {extra && (
        <Flex
          placeItems="center"
          gap="1x"
        >
          {extra}
        </Flex>
      )}
    </Flex>
  );
});

Result.displayName = 'Result';
