import React, { useState } from 'react';
import { Base, Grid, TopBar } from './index';
import ResponsiveProvider from './providers/Responsive';
import { color } from './utils/colors';
import { Button, PageHeader } from './antd';
import Card from './components/Card';
import Flex from './components/Flex';

function App() {
  // Create the count state.
  const [count, setCount] = useState(0);
  // Create the counter (+1 every second).
  // useEffect(() => {
  //   const timer = setTimeout(() => setCount(count + 1), 1000);
  //   return () => clearTimeout(timer);
  // }, [count, setCount]);
  // Return the App component.
  return (
    <ResponsiveProvider value={[1200, 640]}>
      <PageHeader
        title="Storybook"
        description="Showcase and documentation for Cube Cloud UIKit"
      ></PageHeader>
      <TopBar onLogoPress={() => {}}></TopBar>
      <Flex
        styles={{
          flow: 'row',
          content: ['center', , 'start'],
        }}
        gap={['1rem', '2rem']}
      >
        <Button type="primary">123</Button>
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
  );
}

export default App;
