import { ReactNode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CSSTransition } from 'react-transition-group';
import styled from 'styled-components';

import { CloseIcon } from '../../../icons';
import { Button } from '../../actions';
import { Action } from '../../actions/Action/Action';
import { Block } from '../../Block';
import { Card, CubeCardProps } from '../../content/Card/Card';
import { Title } from '../../content/Title';
import { Flex } from '../../layout/Flex';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgb(0 0 0 / 0.4);
  place-content: center;
  place-items: center;
  z-index: 1000;
  display: none;
  white-space: normal;

  .cube-modal {
    --enter-transition-time: 250ms;
    --leave-transition-time: 160ms;
    --base-translate: calc((50vh - 50%) / -3);
    transform: translate(0, calc(var(--base-translate)));
  }

  &.cube-modal-transition-enter {
    opacity: 0;
    display: flex;

    & .cube-modal {
      transform: translate(0, calc(-32px + var(--base-translate))) scale(0.5);
    }
  }

  &.cube-modal-transition-enter-active {
    opacity: 1;
    transition: all var(--enter-transition-time) cubic-bezier(0, 0.5, 0, 1);

    & .cube-modal {
      transform: translate(0, calc(var(--base-translate))) scale(1);
      transition: all var(--enter-transition-time) cubic-bezier(0.5, 0.5, 0, 1);
    }
  }

  &.cube-modal-transition-enter-done {
    display: flex;
  }

  &.cube-modal-transition-exit {
    opacity: 1;
    display: flex;

    & .cube-modal {
      transform: translate(0, calc(var(--base-translate))) scale(1);
    }
  }

  &.cube-modal-transition-exit-active {
    opacity: 0;
    transition: all var(--leave-transition-time) ease-in;

    & .cube-modal {
      transform: translate(0, calc(-32px + var(--base-translate))) scale(0.5);
      transition: all var(--leave-transition-time) ease-in;
    }
  }

  &.cube-modal-transition-exit-done {
    display: none;
  }
`;

export interface CubeModalProps extends CubeCardProps {
  title?: string;
  isVisible?: boolean;
  type?: 'default' | 'primary' | 'info' | 'danger';
  isClosable?: boolean;
  isLoading?: boolean;
  okType?: 'default' | 'primary' | 'danger';
  okText?: string;
  cancelText?: string;
  onOk?: (any) => Promise<any> | void | false;
  onCancel?: () => Promise<any> | void;
  onClose?: () => Promise<any> | void;
  isDisabled?: boolean;
}

/**
 * @deprecated Prefer using Dialog instead
 *
 * DEPRECATED Modal component
 * Designed after AntD Modal component and almost duplicate its API.
 * Use Dialog component instead
 */
export function Modal(allProps: CubeModalProps) {
  let {
    title,
    isVisible,
    type,
    okType,
    isClosable,
    isLoading,
    children,
    okText,
    cancelText,
    width,
    onOk,
    onCancel,
    onClose,
    qa,
    isDisabled,
    ...props
  } = allProps;

  isClosable = !!isClosable;

  const [inProp, setInProp] = useState<boolean>(false);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    setInProp(isVisible || false);
  }, [isVisible]);

  function cancel() {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  }

  function close() {
    if (!isVisible) return;

    if (onClose || onCancel) {
      if (isClosable) {
        // @ts-ignore
        (onClose || onCancel)();
      } else if (onCancel) {
        onCancel();
      }
    }
  }

  const onOverlayClick = (evt) => {
    if (!evt || !evt.target) return;

    if (evt.target.classList.contains('cube-modal-overlay') && !isLoading) {
      close();
    }
  };

  useEffect(() => {
    function handleKeyDown(evt) {
      if (evt.key === 'Escape' && !isLoading) {
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
              // @ts-ignore
              (onClose || onCancel)();
            }
          } catch (e) {
            // do nothing
          } finally {
            setLocalLoading(false);
          }
        }
      })();
    },
    [onOk],
  );

  return (
    <CSSTransition in={inProp} timeout={250} classNames="cube-modal-transition">
      <Overlay className="cube-modal-overlay" onClick={onOverlayClick}>
        <Card
          data-qa={qa || 'Modal'}
          className="cube-modal"
          display="flex"
          role="region"
          color="#dark.85"
          padding="0"
          shadow={true}
          border={false}
          radius="1x"
          width={`288px (100% - 32px) ${
            typeof width === 'number' ? `${width}px` : width || '360px'
          }`}
          style={{ textAlign: 'left' }}
          {...props}
        >
          <Flex placeContent="space-between" padding="2x 3x" border="bottom">
            {typeof title === 'object' ? (
              title
            ) : (
              <Title ellipsis level={4} flexGrow={1}>
                {title}
              </Title>
            )}
            {isClosable ? (
              <Action
                qa="ModalCloseButton"
                width="3x"
                height="3x"
                color={{ '': '#dark-02', hovered: '#purple' }}
                outline={{
                  '': '#purple-03.0',
                  'focused & focus-visible': '#purple-03',
                }}
                label="Close"
                onPress={onClose || onCancel}
              >
                <CloseIcon size={16} />
              </Action>
            ) : null}
          </Flex>
          <Flow
            padding="3x"
            gap="3x"
            height="max (100vh - 90px)"
            style={{ overflow: 'auto' }}
          >
            {typeof children === 'string' ? (
              <Block>{children}</Block>
            ) : (
              children
            )}
            {type !== 'info' && (onOk || onCancel) ? (
              <Space gap="1.5x">
                <Button
                  data-qa={'ConfirmButton'}
                  isDisabled={isDisabled}
                  type="primary"
                  theme={okType === 'danger' ? 'danger' : undefined}
                  isLoading={isLoading || localLoading}
                  onPress={handleOk}
                >
                  {okText || 'OK'}
                </Button>
                <Button
                  data-qa={'CancelButton'}
                  isDisabled={isLoading}
                  onPress={cancel}
                >
                  {cancelText || (okText === 'Yes' ? 'No' : 'Cancel')}
                </Button>
              </Space>
            ) : null}
            {type === 'info' ? (
              <Space>
                <Button
                  data-qa={'OkButton'}
                  isDisabled={isDisabled}
                  type={okType === 'danger' ? 'danger' : 'primary'}
                  onPress={close}
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

interface ModalService {
  root: Element | null;
  items: ModalItem[];
  init: () => void;
  render: () => void;
  _render: (items?: ModalItem[]) => void;
  open: (item: ModalItem) => void;
  close: (item: ModalItem) => void;
  resolve: (item: ModalItem, arg?: any) => void;
  reject: (item: ModalItem, arg?: any) => void;
}

interface ModalItem extends Omit<CubeModalProps, 'id'> {
  id?: number;
  isVisible?: boolean;
  resolve: (any) => void;
  reject: (any) => void;
  content: ReactNode;
}

const modal: ModalService = {
  root: null,
  items: [],
  init() {
    if (this.root) return;

    this.root = document.createElement('div');

    // @ts-ignore
    this.root.classList.add('cube-modal-container');

    document.body.appendChild(this.root);

    this._render([]);
  },
  render() {
    this.init();

    this._render();
  },
  _render(items) {
    if (!items) {
      items = this.items;
    }

    if (!this.root) return;

    const root = createRoot(this.root);

    root.render(
      items.map((item) => {
        const { id, onOk, onCancel, onClose, content, ...options } = item;

        const wrapOnOk = async (arg) => {
          onOk && (await onOk(arg));

          this.resolve(item, arg);
        };
        const wrapOnCancel = () => {
          onCancel && onCancel();

          if (item.type === 'info') {
            this.resolve(item);
          } else {
            this.reject(item);
          }
        };
        const wrapOnClose = () => {
          onClose && onClose();

          if (item.type === 'info') {
            this.resolve(item);
          } else {
            this.reject(item);
          }
        };

        return (
          <Modal
            {...options}
            key={id}
            onOk={wrapOnOk}
            onCancel={wrapOnCancel}
            onClose={wrapOnClose}
          >
            {content}
          </Modal>
        );
      }),
    );
  },
  open(item) {
    item.isVisible = false;
    item.id = ++ID;

    this.items.push(item);

    this.render();

    setTimeout(() => {
      item.isVisible = true;

      this.render();
    });

    return new Promise((resolve, reject) => {
      item.resolve = resolve;
      item.reject = reject;
    });
  },
  close(item) {
    item.isVisible = false;

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
  return modal.open({ type: 'confirm', ...options });
};

Modal.info = (options) => {
  return modal.open({ type: 'info', ...options });
};
