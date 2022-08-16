import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Block } from '../../Block';
import { Action, CubeActionProps } from '../../actions/Action';
import { Space } from '../../layout/Space';
import { CubeFlexProps, Flex } from '../../layout/Flex';
import { Styles, tasty } from '../../../tasty';
import styled from 'styled-components';
import { Button } from '../../actions';
import { useLayoutEffect } from '../../../utils/react';

interface TabData {
  id: string | number;
  title?: string;
  isDirty?: boolean;
}

interface FileTabContextValue {
  addTab: (tab: TabData) => void;
  setTab: (id: string | number) => void;
  removeTab: (tab: TabData) => void;
  currentTab?: string | number;
  setDirtyTab: (id: string | number, isDirty: boolean) => void;
}

const FileTabsContext = createContext<FileTabContextValue>({
  addTab() {},
  removeTab() {},
  setTab() {},
  setDirtyTab() {},
});

const TabsPanelElement = tasty(Space, {
  styles: {
    gap: '.5x',
    flexShrink: 0,
  },
});

const StyledTabsPanelElement = styled(TabsPanelElement)`
  position: relative;
  overflow: auto hidden;
  top: 1px;
  white-space: nowrap;

  ::-webkit-scrollbar-track {
    background: var(--grey-light-color);
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 1px;
    background: var(--dark-04-color);
    background-clip: padding-box;
  }

  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  ::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }
`;

const TabsContainerElement = tasty(Flex, {
  styles: {
    flow: 'column',
    height: 'max 100%',
    width: 'max 100%',
    position: 'relative',
  },
});

const StyledTabsContainerElement = styled(TabsContainerElement)`
  &::before {
    content: '';
    display: block;
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    width: 32px;
    height: 37px;
    transition: all 0.15s linear;
    background-image: linear-gradient(
      to left,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 1)
    );
    z-index: 10;
  }

  &::after {
    content: '';
    display: block;
    opacity: 0;
    position: absolute;
    top: 0;
    right: 0;
    width: 32px;
    height: 37px;
    pointer-events: none;
    transition: all 0.15s linear;
    background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 1)
    );
    z-index: 10;
  }

  &[data-is-left-fade]::before,
  &[data-is-right-fade]::after {
    opacity: 1;
  }
`;

const DirtyBadge = tasty({
  element: 'DirtyBadge',
  styles: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '1x',
    height: '1x',
    fill: '#dark.30',
    radius: 'round',
  },
});

const TabElement = tasty(Action, {
  styles: {
    radius: '1r 1r 0 0',
    padding: '1x 1.5x',
    border: {
      '': 'left top right #clear',
      disabled: 'left top right rgb(227, 227, 233)',
    },
    fill: {
      '': '#dark.04',
      hovered: '#dark.08',
      'disabled, disabled & hover': '#white',
    },
    color: {
      '': '#dark.75',
      'disabled, hovered, hovered & disabled': '#dark',
    },
    cursor: {
      '': 'pointer',
      disabled: 'default',
    },
    fontWeight: 500,
    opacity: 1,
    preset: 'default',
    outline: {
      '': 'inset #purple-03.0',
      'focused & focus-visible': 'inset #purple-03',
    },
    transform: {
      '': 'translate(0, 0)',
      '[disabled]': 'translate(0, 1bw)',
    },
    transition: 'theme 0.2s',
    margin: '1bw bottom',

    DirtyBadge: {
      opacity: {
        '': 1,
        'dirty & :hover': 0,
      },
      pointerEvents: {
        '': 'auto',
        'dirty & :hover': 'none',
      },
    },

    CloseButton: {
      opacity: {
        '': 0,
        '!dirty | :hover': 1,
      },
    },
  },
});

const CloseButton = tasty(Button, {
  element: 'CloseButton',
  type: 'neutral',
  styles: {
    color: {
      '': '#dark.50',
      hovered: '#dark',
    },
    padding: '.25x',
    outline: {
      '': '#purple-03.0',
      'focused & focus-visible': '#purple-03',
    },
    radius: '1r',
  },
});

/**
 * @deprecated consider using <Tabs /> instead
 */
export interface FileTabProps extends Omit<CubeActionProps, 'id'> {
  isDirty?: boolean;
  isDisabled?: boolean;
  children?: ReactNode;
  isClosable?: boolean;
  onClose?: () => void;
}

function Tab({
  isDirty,
  isDisabled,
  children,
  isClosable,
  onClose,
  ...props
}: FileTabProps) {
  return (
    <TabElement
      mods={{
        dirty: isDirty,
      }}
      isDisabled={isDisabled}
      {...props}
    >
      <Space gap=".75x">
        <Block>{children}</Block>
        {(isClosable || isDirty) && (
          <Flex placeItems="center" style={{ position: 'relative' }}>
            {isClosable ? (
              <CloseButton onPress={onClose}>
                <CloseOutlined />
              </CloseButton>
            ) : (
              <div></div>
            )}
            {isDirty ? <DirtyBadge /> : null}
          </Flex>
        )}
      </Space>
    </TabElement>
  );
}

export interface CubeFileTabsProps extends CubeFlexProps {
  /** The initial active key in the tabs (uncontrolled). */
  defaultActiveKey?: string;
  /** The currently active key in the tabs (controlled). */
  activeKey?: string | number;
  /** Handler that is called when the tab is clicked. */
  onTabClick?: (string) => void;
  /** Handler that is called when the tab is closed. */
  onTabClose?: (string) => void;
  /** Styles for the each tab pane */
  paneStyles?: Styles;
  /** Whether the tabs are closable */
  isClosable?: boolean;
  children?: ReactNode;
}

export function FileTabs({
  defaultActiveKey,
  activeKey: activeKeyProp,
  onTabClick,
  onTabClose,
  paneStyles,
  isClosable = true,
  children,
  ...props
}: CubeFileTabsProps) {
  const tabsRef = useRef<HTMLButtonElement>(null);
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeKey, setActiveKey] = useState<string | number | undefined>(
    activeKeyProp || defaultActiveKey,
  );

  const [leftFade, setLeftFade] = useState(false);
  const [rightFade, setRightFade] = useState(false);

  function updateScroll() {
    const el = tabsRef && tabsRef.current;

    if (!el) return;

    setLeftFade(!!el.scrollLeft);
    setRightFade(
      el.scrollWidth !== el.offsetWidth &&
        !!(el.scrollWidth - el.offsetWidth - el.scrollLeft),
    );
  }

  useLayoutEffect(updateScroll, [tabs]);

  function scrollCurrentIntoView() {
    const el = tabsRef && tabsRef.current;

    if (!el) return;

    const current = el.querySelector('button[disabled]');

    if (!current) return;

    current.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'end' });
  }

  useEffect(() => {
    function update() {
      updateScroll();
    }

    if (tabsRef && tabsRef.current) {
      tabsRef.current.addEventListener('scroll', update);
      tabsRef.current.addEventListener('mousewheel', update);
      window.addEventListener('resize', update);
    }

    return () => {
      if (tabsRef && tabsRef.current) {
        tabsRef.current.removeEventListener('scroll', update);
        tabsRef.current.removeEventListener('mousewheel', update);
      }

      window.removeEventListener('resize', update);
    };
  }, [tabsRef]);

  useEffect(scrollCurrentIntoView, [activeKey]);

  useEffect(() => {
    setActiveKey(activeKeyProp);
  }, [activeKeyProp]);

  function getTab(tabs: TabData[], key: string | number): TabData | undefined {
    return tabs.find((tab) => tab.id === key);
  }

  function setTab(key: string | number) {
    if (getTab(tabs, key)) {
      setActiveKey(key);
    }
  }

  function addTab(tab: TabData) {
    setTabs((tabs) => {
      if (!getTab(tabs, tab.id)) {
        return [...tabs, tab];
      }

      return tabs;
    });
  }

  function setDirtyTab(id: string | number, isDirty: boolean) {
    setTabs((tabs) => {
      const tab = getTab(tabs, id);

      if (tab) {
        tab.isDirty = isDirty;

        return [...tabs];
      }

      return tabs;
    });
  }

  function handleClose(tab) {
    if (getTab(tabs, tab.id)) {
      onTabClose && onTabClose(tab.id);
    }
  }

  function removeTab(tab) {
    setTabs((tabs) => {
      const _tabs = tabs.filter((_tab) => _tab.id !== tab.id);

      setActiveKey((prevActiveKey) => {
        if (prevActiveKey === tab.id) {
          return _tabs[0] && _tabs[0].id;
        }

        return prevActiveKey;
      });

      return _tabs;
    });
  }

  function onPress(tab) {
    setTab(tab.id);
    onTabClick && onTabClick(tab.id);
  }

  return (
    <StyledTabsContainerElement
      data-is-left-fade={leftFade || null}
      data-is-right-fade={rightFade || null}
      {...props}
    >
      <FileTabsContext.Provider
        value={{
          addTab,
          setTab,
          removeTab,
          setDirtyTab,
          currentTab: activeKey,
        }}
      >
        <StyledTabsPanelElement ref={tabsRef}>
          {tabs.map((tab) => {
            return (
              <Tab
                onPress={() => onPress(tab)}
                key={tab.id}
                onClose={() => isClosable && handleClose(tab)}
                isClosable={isClosable}
                isDisabled={tab.id === activeKey || false}
                isDirty={tab.isDirty}
              >
                {tab.title}
              </Tab>
            );
          })}
        </StyledTabsPanelElement>
        <Flex
          flexGrow={1}
          border="top rgb(227, 227, 233)"
          {...(paneStyles || {})}
        >
          {children}
        </Flex>
      </FileTabsContext.Provider>
    </StyledTabsContainerElement>
  );
}

export interface CubeFileTabProps extends FileTabProps {
  id: string | number;
  title: string;
}

FileTabs.TabPane = function FileTabPane(allProps: CubeFileTabProps) {
  let { id, title, isDirty, children, ...props } = allProps;
  const { addTab, removeTab, currentTab, setDirtyTab } =
    useContext(FileTabsContext);

  useEffect(() => {
    const tabData = {
      id,
      title,
      isDirty,
    };

    addTab(tabData);

    return () => {
      removeTab(tabData);
    };
  }, [id, title]);

  useEffect(() => {
    setDirtyTab(id, isDirty || false);
  }, [isDirty]);

  const isCurrent = id === currentTab;

  return (
    <Block
      style={{ display: isCurrent ? 'block' : 'none' }}
      flexGrow={1}
      {...props}
    >
      {children}
    </Block>
  );
};
