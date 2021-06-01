import React from 'react';
import { Card } from '../../atoms/Card/Card';
import { Title } from '../../components/Title';
import { Text } from '../../components/Text';

export function StatsCard({ title, value, suffix, ...props }) {
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
