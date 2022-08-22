import { useState } from 'react';

import { Button } from './components/actions';
// import ResponsiveProvider from './providers/Responsive';
// import { Modal } from './components/organisms/Modal/Modal';
// import { notification } from './services/notification';
import { color, StyleProvider } from './tasty';
import { Card } from './components/content/Card/Card';
import { Flex } from './components/layout/Flex';
import { Base64Upload } from './components/other/Base64Upload/Base64Upload';
import { Link } from './components/navigation/Link/Link';
import { Field, Form, useForm } from './components/forms/Form';
import { TextInput } from './components/forms/TextInput/TextInput';
import { Provider } from './provider';
import { GridProvider } from './components/GridProvider';

import { Block, Element, Grid, LoadingAnimation, Space, Title } from './index';

// window.notification = notification;
//
// window.Modal = Modal;

function App() {
  const [inProp, setInProp] = useState(false);
  const [form] = useForm();

  return (
    <>
      <Provider>
        <Block padding="2x 20x">
          <GridProvider columns={3} gap="2x">
            <Flex
              flow="row-reverse wrap"
              align="center"
              justify="center"
              gap="2x"
            >
              <Block width="1sp" height="4x" fill="#purple.04" />
              <Block width="2sp" height="4x" fill="#purple.1" />
              <Block width="2sp" height="4x" fill="#purple.1" />
              <Block width="1sp" height="4x" fill="#purple.1" />
              {/*<Block width="1sp" height="4x" fill="#purple.04"></Block>*/}
            </Flex>
          </GridProvider>
          <GridProvider columns={8} gap="3x">
            <Form
              labelPosition="side"
              labelStyles={{ width: '2sp' }}
              form={form}
            >
              <Field
                name="name"
                rules={[{ required: true, message: 'This field is required' }]}
              >
                <TextInput label="Your name" />
              </Field>
            </Form>
          </GridProvider>
        </Block>
      </Provider>
      {/*<Modal*/}
      {/*  cancelText="Cancel"*/}
      {/*  okText="Ok"*/}
      {/*  onCancel={() => {}}*/}
      {/*  title="Modal"*/}
      {/*  isVisible={true}*/}
      {/*>*/}
      {/*  Modal content*/}
      {/*</Modal>*/}
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
      {/*  /!*  <Button theme="danger">*!/*/}
      {/*  /!*    Delete*!/*/}
      {/*  /!*  </Button>*!/*/}
      {/*  /!*  <Button>*!/*/}
      {/*  /!*    Cancel*!/*/}
      {/*  /!*  </Button>*!/*/}
      {/*  /!*</Space>*!/*/}
      {/*</Modal>*/}
      <Button
        type="clear"
        styles={{
          transition: 'shadow 0.2s ease-in-out',
          color: {
            '': '#dark.75',
            'hovered, focused, pressed': '#purple-text',
          },
        }}
        onPress={() => setInProp(!inProp)}
      >
        Clear
      </Button>
      <LoadingAnimation />
      <Space padding="1x">
        <StyleProvider
          Button={() => ({
            color: {
              '': '#dark',
              pressed: '#purple-text',
            },
          })}
          BigTitle={{ color: '#purple' }}
          Link={() => ({ color: '#dark' })}
        >
          <StyleProvider Button={() => ({ padding: '2x' })}>
            <Title styleName="BigTitle">Test</Title>
            <Button
              styles={{ padding: '2x', border: '2bw #dark.50' }}
              onClick={(e) => console.log(e)}
            >
              Default
            </Button>
          </StyleProvider>
        </StyleProvider>
        <Button type="primary">Primary</Button>
        <Button type="primary">Other Primary</Button>
        <Button theme="danger">Danger</Button>
        <Button type="clear">Clear</Button>
        <Base64Upload>123</Base64Upload>
      </Space>
      <Space padding="1x">
        <Link to="!https://cube.dev">Cube.dev</Link>
      </Space>
      <Provider breakpoints={[1200, 640]}>
        <Flex
          styles={{
            placeContent: ['start', 'center', 'start'],
          }}
          gap={['2x', '4x']}
          flow={['row', 'column', 'row']}
        >
          <button>2</button>
          <button>4</button>
        </Flex>
        <Grid columns="auto 1fr" gap="1x" styles={{ height: '100px' }}>
          <Element styles={{ fill: color('purple', 0.1), width: '200px' }}>
            Without padding
          </Element>
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
      </Provider>
    </>
  );
}

export default App;
