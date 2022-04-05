import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Block } from '../../Block';
import { Space } from '../../layout/Space';
import { CubeFlexProps, Flex } from '../../layout/Flex';
import { Button, CubeButtonProps } from '../../actions';
import { Styles } from '../../../styles/types';

export interface CubeTabData {
  id: string | number;
  qa?: string;
  title?: string;
  isDisabled?: boolean;
  isHidden?: boolean;
}

export interface LegacyCubeTabsContextValue {
  addTab: (CubeTabData) => void;
  setTab: (id: string | number) => void;
  removeTab: (CubeTabData) => void;
  changeTab: (CubeTabData) => void;
  currentTab?: string | number;
}

const LegacyTabsContext = createContext<LegacyCubeTabsContextValue>({
  addTab() {},
  removeTab() {},
  setTab() {},
  changeTab() {},
});

const TAB_STYLES = {
  color: {
    '': '#dark',
    'selected, hovered': '#purple-text',
    disabled: '#dark.50',
  },
  fill: '#purple.0',
  textAlign: 'center',
  fontWeight: 600,
  padding: '(1x - 1px) (1x - 1px)',
  radius: '1r 1r 0 0',
  border: 0,
} as const;

const TAB_CSS = `
&::before {
  --outline-size: 0px;
  content: '';
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: inset 0 calc(-1 * var(--outline-size)) 0 var(--purple-color);
  pointer-events: none;
  transition: opacity linear .2s, box-shadow linear .2s;
}
&[data-is-selected]::before {
  --outline-size: 2px;
}
&:not([data-is-selected]):not([disabled])[data-is-hovered]::before {
  --outline-size: 1px;
}
`;

const TABS_PANEL_CSS = `
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

const TABS_CONTAINER_CSS = `
  position: relative;

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
    transition: all .15s linear;
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
    transition: all .15s linear;
    background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 1)
    );
    z-index: 10;
  }

  &[data-is-left-fade]::before, &[data-is-right-fade]::after {
    opacity: 1;
  }
`;

export interface LegacyCubeTabProps extends Omit<CubeButtonProps, 'id'> {
  id?: string | number;
  title?: string;
  isSelected?: boolean;
  isHidden?: boolean;
  onClose?: () => void;
}

const Tab = ({
  isSelected,
  isHidden,
  onClose,
  ...props
}: Omit<LegacyCubeTabProps, 'id'>) => {
  return (
    <Button
      type="tab"
      styles={TAB_STYLES}
      css={TAB_CSS}
      isSelected={isSelected}
      isHidden={isHidden}
      {...props}
    />
  );
};

export interface CubeTabsProps extends CubeFlexProps {
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
  /** Additional content along the tabs */
  extra?: ReactNode;
}

export function LegacyTabs({
  defaultActiveKey,
  activeKey: activeKeyProp,
  onTabClick,
  onTabClose,
  paneStyles,
  extra,
  children,
  ...props
}: CubeTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);

  const [tabs, setTabs] = useState<CubeTabData[]>([]);
  const [activeKey, setActiveKey] = useState(activeKeyProp || defaultActiveKey);

  const [leftFade, setLeftFade] = useState<boolean>(false);
  const [rightFade, setRightFade] = useState<boolean>(false);

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

  function getTab(
    tabs: CubeTabData[],
    key: string | number,
  ): CubeTabData | undefined {
    return tabs.find((tab) => tab.id === key);
  }

  function setTab(key: string | number) {
    if (getTab(tabs, key)) {
      setActiveKey(key);
    }
  }

  function addTab(tab: CubeTabData) {
    setTabs((tabs) => {
      if (!getTab(tabs, tab.id)) {
        return [...tabs, tab];
      }

      return tabs;
    });
  }

  function removeTab(tab: CubeTabData) {
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

  function changeTab(tab: CubeTabData) {
    setTabs((tabs) => {
      const existTab = tabs.find((_tab) => _tab.id === tab.id);

      if (existTab) {
        Object.assign(existTab, tab);
      }

      return [...tabs];
    });
  }

  function onPress(tab: CubeTabData) {
    onTabClick && onTabClick(tab.id);
    setTab(tab.id);
  }

  return (
    <Flex
      flow="column"
      height="max 100%"
      width="max 100%"
      data-is-left-fade={leftFade || null}
      data-is-right-fade={rightFade || null}
      css={TABS_CONTAINER_CSS}
      {...props}
    >
      <LegacyTabsContext.Provider
        value={{
          addTab,
          setTab,
          removeTab,
          changeTab,
          currentTab: activeKey,
        }}
      >
        <Space gap=".5x" placeContent="center space-between">
          <Space ref={tabsRef} gap="1x" flexShrink={0} css={TABS_PANEL_CSS}>
            {tabs.map((tab) => {
              return (
                <Tab
                  data-qa={tab.qa}
                  onPress={() => onPress(tab)}
                  key={tab.id}
                  isSelected={tab.id === activeKey || false}
                  isDisabled={tab.isDisabled}
                  isHidden={tab.isHidden}
                >
                  {tab.title}
                </Tab>
              );
            })}
          </Space>
          {extra}
        </Space>
        <Flex
          flexGrow={1}
          border="top rgb(227, 227, 233)"
          {...(paneStyles || {})}
        >
          {children}
        </Flex>
      </LegacyTabsContext.Provider>
    </Flex>
  );
}

LegacyTabs.TabPane = function TabPane({
  id,
  title,
  qa,
  isHidden,
  isDisabled,
  children,
  ...props
}: LegacyCubeTabProps) {
  const { addTab, removeTab, changeTab, currentTab } =
    useContext(LegacyTabsContext);

  useEffect(() => {
    const tabData = {
      id,
      qa,
      title,
      isDisabled,
      isHidden,
    };

    addTab(tabData);

    return () => {
      removeTab(tabData);
    };
  }, [id]);

  useEffect(() => {
    changeTab({
      id,
      qa,
      title,
      isDisabled,
      isHidden,
    });
  }, [title, isDisabled, isHidden]);

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
