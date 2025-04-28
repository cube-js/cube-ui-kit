import { ReactNode } from 'react';

import { Card, CubeCardProps } from '../../content/Card/Card';
import { Text } from '../../content/Text';
import { Title } from '../../content/Title';

export interface CubeStatsCard extends CubeCardProps {
  title?: string | ReactNode;
  value?: string | number | ReactNode;
  suffix?: string | number | ReactNode;
}

export function StatsCard({ title, value, suffix, ...props }: CubeStatsCard) {
  return (
    <Card
      display="flex"
      placeContent="space-between"
      gap="1x"
      border={false}
      shadow="0 2px 6px #dark.10"
      padding="2.5x"
      {...props}
    >
      <Title nowrap level={4} color="#minor" preset="default">
        {title}
      </Title>
      <Text.Strong preset="h3">
        {value} {suffix}
      </Text.Strong>
    </Card>
  );
}
