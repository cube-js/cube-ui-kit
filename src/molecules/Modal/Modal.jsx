/**
 * Modal component
 * Designed after AntD Modal component and almost duplicate its API.
 */

import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Action from '../../components/Action';
import Card from '../../components/Card';
import Flow from '../../components/Flow';
import Flex from '../../components/Flex';
import Block from '../../components/Block';
import Button from '../../atoms/Button/Button';
import Space from '../../components/Space';
import styled from 'styled-components';
import Title from '../../components/Title';
import { CloseOutlined } from '@ant-design/icons';
import { CSSTransition } from 'react-transition-group';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.4);
  place-content: center;
  place-items: center;
  z-index: 9999;
  display: none;

  &.cube-modal-transition-enter {
    opacity: 0;
    display: flex;

    & .cube-modal {
      transform: translate(0, -32px) scale(0.5);
    }
  }

  &.cube-modal-transition-enter-active {
    opacity: 1;
    transition: all 250ms cubic-bezier(0, 0.5, 0, 1);

    & .cube-modal {
      transform: translate(0, 0) scale(1);
      transition: all 250ms cubic-bezier(0.5, 0.5, 0, 1);
    }
  }

  &.cube-modal-transition-enter-done {
    display: flex;
  }

  &.cube-modal-transition-exit {
    opacity: 1;
    display: flex;

    & .cube-modal {
      transform: translate(0, 0) scale(1);
    }
  }

  &.cube-modal-transition-exit-active {
    opacity: 0;
    transition: all 160ms ease-in;

    & .cube-modal {
      transform: translate(0, -32px) scale(0.5);
      transition: all 160ms ease-in;
    }
  }

  &.cube-modal-transition-exit-done {
    display: none;
  }
`;

export default function Modal({
  title,
  visible,
  type,
  okType,
  closable,
  loading,
  children,
  okText,
  cancelText,
  width,
  onOk,
  onCancel,
  onClose,
  qa,
  disabled,
  ...props
}) {
  closable = !!closable;

  const [inProp, setInProp] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    setInProp(visible);
  }, [visible]);

  function close() {
    if (onClose || onCancel) {
      if (closable) {
        (onClose || onCancel)();
      } else {
        (onCancel || onClose)();
      }
    }
  }

  const onOverlayClick = (evt) => {
    if (!evt || !evt.target) return;

    if (evt.target.classList.contains('cube-modal-overlay') && !loading) {
      close();
    }
  };

  useEffect(() => {
    function handleKeyDown(evt) {
      if (evt.key === 'Escape' && !loading) {
        close();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOk = useCallback(
    (arg) => {
      setLocalLoading(true);

      (async () => {
        if (onOk) {
          try {
            if ((await onOk(arg)) === false && (onClose || onCancel)) {
              (onClose || onCancel)();
            }
          } catch (e) {
          } finally {
            setLocalLoading(false);
          }
        }
      })();
    },
    [onOk],
  );

  return (
    <CSSTransition
      in={inProp}
      timeout={250}
      classNames="cube-modal-transition"
    >
      <Overlay className="cube-modal-overlay" onClick={onOverlayClick}>
        <Card
          data-qa={qa || 'Modal'}
          className="cube-modal"
          display="flex"
          column="row"
          role="region"
          color="#dark.85"
          padding="0"
          shadow={true}
          border={false}
          radius="1.5r"
          width={`288px (100% - 32px) ${
            typeof width === 'number' ? `${width}px` : width || '360px'
          }`}
          style={{ textAlign: 'left' }}
          {...props}
        >
          <Flex content="space-between" padding="2x 3x" border="bottom">
            {typeof title === 'object' ? (
              title
            ) : (
              <Title level={4}>{title}</Title>
            )}
            {closable ? (
              <Action
                data-qa="ModalCloseButton"
                width="3x"
                height="3x"
                onClick={onClose || onCancel}
                color={{ '': '#dark.75', hovered: '#purple' }}
                outline={{
                  '': '#purple-03.0',
                  'focused & focus-visible': '#purple-03',
                }}
              >
                <CloseOutlined style={{ fontSize: 16 }} />
              </Action>
            ) : null}
          </Flex>
          <Flow
            padding="3x"
            gap="3x"
            height="max (100vh - 90px)"
            style={{ overflow: 'auto' }}
          >
            {typeof children === 'string' ? <Block>{children}</Block> : children}
            {type !== 'info' && (onOk || onCancel) ? (
              <Space gap="1.5x">
                <Button
                  data-qa={'ConfirmButton'}
                  disabled={disabled}
                  type={okType === 'danger' ? 'danger' : 'primary'}
                  loading={loading || localLoading}
                  onClick={handleOk}
                >
                  {okText || 'OK'}
                </Button>
                <Button
                  data-qa={'CancelButton'}
                  onClick={onCancel || onClose}
                  disabled={loading}
                >
                  {okText === 'Yes' ? 'No' : cancelText || 'Cancel'}
                </Button>
              </Space>
            ) : null}
            {type === 'info' ? (
              <Space>
                <Button
                  data-qa={'OkButton'}
                  disabled={disabled}
                  type={okType === 'danger' ? 'danger' : 'primary'}
                  onClick={onClose}
                >
                  {okText || 'OK'}
                </Button>
              </Space>
            ) : null}
          </Flow>
        </Card>
      </Overlay>
    </CSSTransition>
  );
}

let ID = 0;

const modal = {
  items: [],
  init() {
    if (this.root) return;

    this.root = document.createElement('div');

    this.root.classList.add('cube-modal-container');

    document.body.appendChild(this.root);

    this._render([]);
  },
  render() {
    this.init();

    this._render();
  },
  _render(items = this.items) {
    ReactDOM.render(
      items.map((item) => {
        const { id, onOk, onCancel, onClose, content, ...options } = item;

        const wrapOnOk = async (arg) => {
          onOk && (await onOk(arg));

          this.resolve(item, arg);
        };
        const wrapOnCancel = (arg) => {
          onCancel && onCancel(arg);

          this.reject(item, arg);
        };
        const wrapOnClose = (arg) => {
          onClose && onClose(arg);

          if (item.type === 'info') {
            this.resolve(item, arg);
          } else {
            this.reject(item, arg);
          }
        };

        return (
          <Modal
            {...options}
            onOk={wrapOnOk}
            onCancel={wrapOnCancel}
            onClose={wrapOnClose}
            key={id}
          >
            {content}
          </Modal>
        );
      }),
      this.root,
    );
  },
  open(item) {
    item.visible = false;
    item.id = ++ID;

    this.items.push(item);

    this.render();

    setTimeout(() => {
      item.visible = true;

      this.render();
    });

    return new Promise((resolve, reject) => {
      item.resolve = resolve;
      item.reject = reject;
    });
  },
  close(item) {
    item.visible = false;

    this.render();

    setTimeout(() => {
      this.items = this.items.filter((modal) => item.id !== modal.id);

      this.render();
    }, 1000);
  },
  resolve(item, arg) {
    item.resolve(arg);

    this.close(item);
  },
  reject(item, arg) {
    item.reject(arg);

    this.close(item);
  },
};

Modal.confirm = (options) => {
  return modal.open({ type: 'confirm', ...Object.assign({ closable: true }, options) });
};

Modal.info = (options) => {
  return modal.open({ type: 'info', ...Object.assign({ closable: true }, options) });
};
