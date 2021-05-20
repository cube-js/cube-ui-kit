import React, { useState } from 'react';
import { Base, Button, Grid, TopBar, Space, LoadingAnimation } from './index';
import ResponsiveProvider from './providers/Responsive';
import { color } from './utils/colors';
import Card from './atoms/Card/Card';
import Flex from './components/Flex';
import Base64Upload from './atoms/Base64Upload/Base64Upload';
import Link from './components/Link';
import Modal from './molecules/Modal/Modal';
import notification from './services/notification';

window.notification = notification;

window.Modal = Modal;

function App() {
  const [inProp, setInProp] = useState(false);

  return (
    <>
      <Modal
        cancelText="Cancel"
        okText="Ok"
        onCancel={() => {}}
        onOk={function noRefCheck() {}}
        title="Modal"
        visible={true}
      >
        Modal content
      </Modal>
      {/*<Modal*/}
      {/*  title="Delete file"*/}
      {/*  icon={<ExclamationCircleOutlined />}*/}
      {/*  visible={inProp}*/}
      {/*  okType="danger"*/}
      {/*  action="Yes"*/}
      {/*  onOk={() => {*/}
      {/*    return new Promise((resolve, reject) => {*/}
      {/*      setTimeout(() => {*/}
      {/*        setInProp(false);*/}
      {/*        resolve();*/}
      {/*      }, 1000);*/}
      {/*    });*/}
      {/*  }}*/}
      {/*  onCancel={() => setInProp(false)}*/}
      {/*>*/}
      {/*  <Block>Do you really want to delete it?</Block>*/}
      {/*  /!*<Space gap="1.5x">*!/*/}
      {/*  /!*  <Button type="danger">*!/*/}
      {/*  /!*    Delete*!/*/}
      {/*  /!*  </Button>*!/*/}
      {/*  /!*  <Button>*!/*/}
      {/*  /!*    Cancel*!/*/}
      {/*  /!*  </Button>*!/*/}
      {/*  /!*</Space>*!/*/}
      {/*</Modal>*/}
      <Button
        onPress={() => setInProp(!inProp)}
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
          gap={['2x', '4x']}
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
