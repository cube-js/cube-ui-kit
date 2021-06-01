import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../../atoms/Button/Button';

export default {
  title: 'UIKit/Molecules/Modal',
  component: Modal,
  argTypes: {
    type: {
      control: {
        type: 'inline-radio',
        options: [undefined, 'confirm', 'info'],
      },
    },
    okText: {
      control: 'text',
    },
    cancelText: {
      control: 'text',
    },
    onOk: Function,
    onCancel: Function,
    isLoading: {
      control: 'boolean',
    },
    isDisabled: {
      control: 'boolean',
    },
    isClosable: {
      control: 'boolean',
    },
    title: {
      control: 'text',
    },
    width: {
      control: {
        type: 'range',
        min: 280,
        max: 800,
        step: 10,
      },
    },
  },
};

const Template = ({ content, ...args }) => {
  const [inProp, setInProp] = useState(false);

  function close() {
    setInProp(false);
  }

  return (
    <>
      <Button onPress={() => setInProp(true)}>Open Modal</Button>
      <Modal
        {...args}
        onOk={close}
        onCancel={close}
        onClose={close}
        isVisible={inProp}
      >
        {content}
      </Modal>
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  okText: 'Ok',
  type: undefined,
  cancelText: 'Cancel',
  onOk() {
    alert('OK');
  },
  onCancel() {
    alert('Cancel');
  },
  title: 'Modal Title',
  content: 'Modal content',
  closable: false,
  loading: false,
  width: 480,
  disabled: false,
};
