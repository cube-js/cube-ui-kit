import { Card, CubeCardProps } from '../../content/Card/Card';
import { Title } from '../../content/Title';
import { Text } from '../../content/Text';
import { ReactNode } from 'react';

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
      <Title level={4} color="#minor" preset="default" nowrap>
        {title}
      </Title>
      <Text.Strong preset="h3">
        {value} {suffix}
      </Text.Strong>
    </Card>
  );
}
