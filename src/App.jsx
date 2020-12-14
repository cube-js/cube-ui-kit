import React from 'react';
import { Base, Button, Grid, TopBar, Space } from './index';
import ResponsiveProvider from './providers/Responsive';
import { color } from './utils/colors';
import { PageHeader } from './antd';
import Card from './components/Card';
import Flex from './components/Flex';
import Base64Upload from './components/Base64Upload';

function App() {
  return (
    <>
      <Space padding="1x">
        <Button>123</Button>
        <Button type="primary">123</Button>
        <Base64Upload>123</Base64Upload>
      </Space>
      <ResponsiveProvider value={[1200, 640]}>
        <PageHeader
          title="Storybook"
          description="Showcase and documentation for Cube Cloud UIKit"
        />
        <TopBar onLogoPress={() => {}} />
        <Flex
          styles={{
            flow: 'row',
            content: ['center', , 'start'],
          }}
          gap={['1rem', '2rem']}
        >
          <button>2</button>
        </Flex>
        <Grid columns="auto 1fr" gap="1x" styles={{ height: '100px' }}>
          <Base styles={{ bg: color('purple', 0.1), width: '200px' }}>
            Without padding
          </Base>
          <Card
            styles={{
              bg: '#purple.50',
              border: true,
              shadow: true,
              padding: '2x',
            }}
          >
            Text
          </Card>
        </Grid>
      </ResponsiveProvider>
    </>
  );
}

export default App;
