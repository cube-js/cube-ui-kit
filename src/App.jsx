import React, { useState } from 'react';
import { Base, Grid } from './index';
import ResponsiveProvider from './providers/Responsive';
import { color } from './utils/colors';
import { Button } from './antd';
import Card from './components/Card';

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
      <Base
        styles={{
          display: 'flex',
          flow: 'row',
          content: ['center', , 'start'],
          gap: ['1rem', '2rem'],
        }}
      >
        <Button type="primary">123</Button>
        <button>2</button>
      </Base>
      <Grid columns="auto 1fr" gap="1x" styles={{ height: '100px' }}>
        <Base
          styles={{ bg: color('purple', 0.1), width: '200px' }}
        >Without padding</Base>
        <Card styles={{
          bg: '#purple.50',
          border: true,
          shadow: true,
          padding: '2x' }}>Text</Card>
      </Grid>
    </ResponsiveProvider>
  );
}

export default App;
