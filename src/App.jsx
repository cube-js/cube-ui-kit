import React from 'react';
import { Base, Button, Grid, TopBar, Space, LoadingAnimation } from './index';
import ResponsiveProvider from './providers/Responsive';
import { color } from './utils/colors';
import Card from './components/Card';
import Flex from './components/Flex';
import Base64Upload from './components/Base64Upload';
import Link from './components/Link';
// import notification from './services/notification';

// window.notification = notification;

function App() {
  return (
    <>
      <Button
        type="clear"
        styles={{
          color: {
            '': '#dark.75',
            'hovered, focused, pressed': '#purple-text',
          },
        }}
      >
        Clear
      </Button>
      <LoadingAnimation />
      <Space padding="1x">
        <Button>Default</Button>
        <Button type="primary">Primary</Button>
        <Button type="danger">Danger</Button>
        <Button type="clear">Clear</Button>
        <Base64Upload>123</Base64Upload>
      </Space>
      <Space padding="1x">
        <Link to="!https://cube.dev">Cube.dev</Link>
      </Space>
      <ResponsiveProvider value={[1200, 640]}>
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
          <Base styles={{ fill: color('purple', 0.1), width: '200px' }}>
            Without padding
          </Base>
          <Card
            styles={{
              fill: '#purple.50',
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
