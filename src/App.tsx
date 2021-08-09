import { useState } from 'react';
import { Base, Grid, TopBar, Space, LoadingAnimation, Block } from './index';
import { Button } from './atoms/Button/Button';
// import ResponsiveProvider from './providers/Responsive';
import { color } from './utils/colors';
import { Card } from './atoms/Card/Card';
import { Flex } from './components/Flex';
import { Base64Upload } from './atoms/Base64Upload/Base64Upload';
import { Link } from './atoms/Link/Link';
import { Modal } from './molecules/Modal/Modal';
// import { notification } from './services/notification';
import { StyleProvider } from './providers/Styles';
import { Form, useForm, Field } from './atoms/Form';
import { TextInput } from './atoms/TextInput/TextInput';
import { Provider } from './provider';
import { GridProvider } from './components/GridProvider';

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
            <Flex flow="row wrap" align="center" justify="center">
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
                <TextInput label="Your name"></TextInput>
              </Field>
            </Form>
          </GridProvider>
        </Block>
      </Provider>
      <Modal
        cancelText="Cancel"
        okText="Ok"
        onCancel={() => {}}
        onOk={function noRefCheck() {}}
        title="Modal"
        isVisible={true}
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
        <StyleProvider
          Button={() => ({
            color: {
              '': '#dark',
              pressed: '#purple-text',
            },
          })}
          Link={() => ({ color: '#dark' })}
        >
          <StyleProvider Button={() => ({ padding: '2x' })}>
            <Button styles={{ padding: '2x', border: '2bw #dark.50' }}>
              Default
            </Button>
          </StyleProvider>
        </StyleProvider>
        <Button type="primary">Primary</Button>
        <Button type="primary">Other Primary</Button>
        <Button type="danger">Danger</Button>
        <Button type="clear">Clear</Button>
        <Base64Upload>123</Base64Upload>
      </Space>
      <Space padding="1x">
        <Link to="!https://cube.dev">Cube.dev</Link>
      </Space>
      <Provider breakpoints={[1200, 640]}>
        <TopBar onLogoPress={() => {}} />
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
      </Provider>
    </>
  );
}

export default App;
