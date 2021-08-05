import { Card, CubeCardProps } from '../../atoms/Card/Card';
import { Title } from '../../components/Title';
import { Text } from '../../components/Text';

export interface CubeStatsCard extends CubeCardProps {
  title?: string;
  value?: string | number;
  suffix?: string | number;
}

export function StatsCard({ title, value, suffix, ...props }: CubeStatsCard) {
  return (
    <Card
      gap="1x"
      border={false}
      shadow="0 2px 6px #dark.10"
      padding="2.5x"
      {...props}
    >
      <Title level={4} weight={400} color="#minor" size="md" nowrap>
        {title}
      </Title>
      <Text.Strong size="h3">
        {value} {suffix}
      </Text.Strong>
    </Card>
  );
}
