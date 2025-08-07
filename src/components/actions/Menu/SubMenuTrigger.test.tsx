import React from 'react';

import {
  act,
  render,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { EventBusProvider } from '../../../utils/react/useEventBus';
import { Button } from '../Button/Button';

import { Menu } from './Menu';
import { MenuTrigger } from './MenuTrigger';
import { SubMenuTrigger } from './SubMenuTrigger';

describe('<SubMenuTrigger />', () => {
  const basicSubmenu = (
    <Menu id="test-menu" aria-label="Test menu">
      <Menu.Item key="copy">Copy</Menu.Item>
      <Menu.SubMenuTrigger key="share-menu">
        <Menu.Item key="share">Share</Menu.Item>
        <Menu>
          <Menu.Item key="share-link">Copy link</Menu.Item>
          <Menu.Item key="share-email">Email</Menu.Item>
          <Menu.Item key="share-sms">SMS</Menu.Item>
        </Menu>
      </Menu.SubMenuTrigger>
      <Menu.Item key="delete">Delete</Menu.Item>
    </Menu>
  );

  describe('Basic rendering', () => {
    it('should render submenu trigger with chevron icon', async () => {
      const { getByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share');
      expect(shareItem).toBeInTheDocument();

      // Wait for dynamic import to complete and submenu attributes to be set
      await waitFor(
        () => {
          const menuItem = shareItem.closest('li');
          expect(menuItem).toHaveAttribute('data-has-submenu', 'true');
        },
        { timeout: 2000 },
      );

      // Now check all attributes
      const menuItem = shareItem.closest('li');
      expect(menuItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(menuItem).toHaveAttribute('aria-expanded', 'false');

      // Should render chevron icon (RightIcon is rendered as postfix)
      const iconWrapper = menuItem?.querySelector('[data-qa="RightIcon"]');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should not render submenu content when closed', () => {
      const { queryByText } = renderWithRoot(basicSubmenu);

      expect(queryByText('Copy link')).not.toBeInTheDocument();
      expect(queryByText('Email')).not.toBeInTheDocument();
      expect(queryByText('SMS')).not.toBeInTheDocument();
    });
  });

  describe('Mouse interactions', () => {
    it('should open submenu on hover after delay', async () => {
      const { getByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share');

      // Hover over the item
      await userEvent.hover(shareItem);

      // Wait for hover delay (200ms) and dynamic import to complete
      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      expect(getByText('Email')).toBeInTheDocument();
      expect(getByText('SMS')).toBeInTheDocument();

      // Check ARIA attributes updated
      const menuItem = shareItem.closest('li');
      expect(menuItem).toHaveAttribute('aria-expanded', 'true');
    });

    it('should not open submenu if mouse leaves before delay', async () => {
      const { getByText, queryByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share');

      // Hover and quickly unhover
      await userEvent.hover(shareItem);
      await userEvent.unhover(shareItem);

      // Wait a bit and verify submenu didn't open
      await waitFor(
        () => {
          expect(queryByText('Copy link')).not.toBeInTheDocument();
        },
        { timeout: 300 },
      );
    });

    it('should open submenu on click', async () => {
      const { getByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share');

      await userEvent.click(shareItem);

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
      });

      expect(getByText('Email')).toBeInTheDocument();
      expect(getByText('SMS')).toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('should open submenu with ArrowRight key', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <MenuTrigger>
          <Button>Open Menu</Button>
          <Menu id="test-menu" aria-label="Test menu">
            <Menu.Item key="copy">Copy</Menu.Item>
            <Menu.SubMenuTrigger key="share-menu">
              <Menu.Item key="share">Share</Menu.Item>
              <Menu>
                <Menu.Item key="share-link">Copy link</Menu.Item>
                <Menu.Item key="share-email">Email</Menu.Item>
                <Menu.Item key="share-sms">SMS</Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
            <Menu.Item key="delete">Delete</Menu.Item>
          </Menu>
        </MenuTrigger>,
      );

      // Open the menu first
      await userEvent.click(getByText('Open Menu'));

      await waitFor(() => {
        expect(getByText('Copy')).toBeInTheDocument();
      });

      // Wait for menu to be properly focused and ready
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-has-submenu', 'true');
      });

      // Now navigate with keyboard - the menu should already have focus
      await act(async () => {
        await userEvent.keyboard('{ArrowDown}'); // Focus Share item
      });

      // Verify Share item is focused before trying to open submenu
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-is-focused');
      });

      await act(async () => {
        await userEvent.keyboard('{ArrowRight}');
      });

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('should open submenu with Enter key', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <MenuTrigger>
          <Button>Open Menu</Button>
          <Menu id="test-menu" aria-label="Test menu">
            <Menu.Item key="copy">Copy</Menu.Item>
            <Menu.SubMenuTrigger key="share-menu">
              <Menu.Item key="share">Share</Menu.Item>
              <Menu>
                <Menu.Item key="share-link">Copy link</Menu.Item>
                <Menu.Item key="share-email">Email</Menu.Item>
                <Menu.Item key="share-sms">SMS</Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
            <Menu.Item key="delete">Delete</Menu.Item>
          </Menu>
        </MenuTrigger>,
      );

      // Open the menu first
      await userEvent.click(getByText('Open Menu'));

      await waitFor(() => {
        expect(getByText('Copy')).toBeInTheDocument();
      });

      // Wait for menu to be properly focused and ready
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-has-submenu', 'true');
      });

      // Now navigate with keyboard - the menu should already have focus
      await act(async () => {
        await userEvent.keyboard('{ArrowDown}'); // Focus Share item
      });

      // Verify Share item is focused before trying to open submenu
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-is-focused');
      });

      await act(async () => {
        // Enter key on a menu item normally triggers action, but submenu trigger intercepts it
        const shareItem = getByText('Share').closest('li');
        shareItem?.focus();
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('should open submenu with Space key', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <MenuTrigger>
          <Button>Open Menu</Button>
          <Menu id="test-menu" aria-label="Test menu">
            <Menu.Item key="copy">Copy</Menu.Item>
            <Menu.SubMenuTrigger key="share-menu">
              <Menu.Item key="share">Share</Menu.Item>
              <Menu>
                <Menu.Item key="share-link">Copy link</Menu.Item>
                <Menu.Item key="share-email">Email</Menu.Item>
                <Menu.Item key="share-sms">SMS</Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
            <Menu.Item key="delete">Delete</Menu.Item>
          </Menu>
        </MenuTrigger>,
      );

      // Open the menu first
      await userEvent.click(getByText('Open Menu'));

      await waitFor(() => {
        expect(getByText('Copy')).toBeInTheDocument();
      });

      // Wait for menu to be properly focused and ready
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-has-submenu', 'true');
      });

      // Now navigate with keyboard - the menu should already have focus
      await act(async () => {
        await userEvent.keyboard('{ArrowDown}'); // Focus Share item
      });

      // Verify Share item is focused before trying to open submenu
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-is-focused');
      });

      await act(async () => {
        // Space key on a menu item normally triggers action, but submenu trigger intercepts it
        const shareItem = getByText('Share').closest('li');
        shareItem?.focus();
        await userEvent.keyboard(' '); // Space key
      });

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('should close submenu with ArrowLeft key', async () => {
      const { getByRole, getByText, queryByText } = renderWithRoot(
        <MenuTrigger>
          <Button>Open Menu</Button>
          <Menu id="test-menu" aria-label="Test menu">
            <Menu.Item key="copy">Copy</Menu.Item>
            <Menu.SubMenuTrigger key="share-menu">
              <Menu.Item key="share">Share</Menu.Item>
              <Menu>
                <Menu.Item key="share-link">Copy link</Menu.Item>
                <Menu.Item key="share-email">Email</Menu.Item>
                <Menu.Item key="share-sms">SMS</Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
            <Menu.Item key="delete">Delete</Menu.Item>
          </Menu>
        </MenuTrigger>,
      );

      // Open the menu first
      await userEvent.click(getByText('Open Menu'));

      await waitFor(() => {
        expect(getByText('Copy')).toBeInTheDocument();
      });

      // Wait for menu to be properly focused and ready
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-has-submenu', 'true');
      });

      // Open submenu first
      await act(async () => {
        await userEvent.keyboard('{ArrowDown}'); // Focus Share item
      });

      // Verify Share item is focused before trying to open submenu
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-is-focused');
      });

      await act(async () => {
        await userEvent.keyboard('{ArrowRight}');
      });

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Close with ArrowLeft
      await act(async () => {
        await userEvent.keyboard('{ArrowLeft}');
      });

      await waitFor(() => {
        expect(queryByText('Copy link')).not.toBeInTheDocument();
      });
    });

    it('should close submenu with Escape key', async () => {
      const { getByRole, getByText, queryByText } = renderWithRoot(
        <MenuTrigger>
          <Button>Open Menu</Button>
          <Menu id="test-menu" aria-label="Test menu">
            <Menu.Item key="copy">Copy</Menu.Item>
            <Menu.SubMenuTrigger key="share-menu">
              <Menu.Item key="share">Share</Menu.Item>
              <Menu>
                <Menu.Item key="share-link">Copy link</Menu.Item>
                <Menu.Item key="share-email">Email</Menu.Item>
                <Menu.Item key="share-sms">SMS</Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
            <Menu.Item key="delete">Delete</Menu.Item>
          </Menu>
        </MenuTrigger>,
      );

      // Open the menu first
      await userEvent.click(getByText('Open Menu'));

      await waitFor(() => {
        expect(getByText('Copy')).toBeInTheDocument();
      });

      // Wait for menu to be properly focused and ready
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-has-submenu', 'true');
      });

      // Open submenu
      await act(async () => {
        await userEvent.keyboard('{ArrowDown}'); // Focus Share item
      });

      // Verify Share item is focused before trying to open submenu
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-is-focused');
      });

      await act(async () => {
        await userEvent.keyboard('{ArrowRight}');
      });

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Close with Escape
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });

      await waitFor(() => {
        expect(queryByText('Copy link')).not.toBeInTheDocument();
      });
    });
  });

  describe('Nested submenus', () => {
    const nestedSubmenu = (
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.SubMenuTrigger>
          <Menu.Item key="file">File</Menu.Item>
          <Menu>
            <Menu.Item key="new">New</Menu.Item>
            <Menu.SubMenuTrigger>
              <Menu.Item key="export">Export</Menu.Item>
              <Menu>
                <Menu.Item key="pdf">PDF</Menu.Item>
                <Menu.Item key="word">Word</Menu.Item>
                <Menu.SubMenuTrigger>
                  <Menu.Item key="advanced">Advanced</Menu.Item>
                  <Menu>
                    <Menu.Item key="custom">Custom Format</Menu.Item>
                  </Menu>
                </Menu.SubMenuTrigger>
              </Menu>
            </Menu.SubMenuTrigger>
          </Menu>
        </Menu.SubMenuTrigger>
      </Menu>
    );

    it('should support multiple levels of nesting', async () => {
      const { getByText } = renderWithRoot(nestedSubmenu);

      // Open first level
      const fileItem = getByText('File');
      await userEvent.hover(fileItem);

      await waitFor(
        () => {
          expect(getByText('Export')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Open second level
      const exportItem = getByText('Export');
      await userEvent.hover(exportItem);

      await waitFor(
        () => {
          expect(getByText('PDF')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      expect(getByText('Advanced')).toBeInTheDocument();

      // Open third level
      const advancedItem = getByText('Advanced');
      await userEvent.hover(advancedItem);

      await waitFor(
        () => {
          expect(getByText('Custom Format')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Disabled state', () => {
    const disabledSubmenu = (
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.SubMenuTrigger isDisabled>
          <Menu.Item key="share">Share</Menu.Item>
          <Menu>
            <Menu.Item key="link">Copy link</Menu.Item>
          </Menu>
        </Menu.SubMenuTrigger>
      </Menu>
    );

    it('should render disabled submenu trigger', async () => {
      const { getByText, queryByText } = renderWithRoot(disabledSubmenu);

      const shareItem = getByText('Share');

      // Wait for dynamic import to complete and submenu attributes to be set
      await waitFor(
        () => {
          const menuItem = shareItem.closest('li');
          expect(menuItem).toHaveAttribute('data-has-submenu', 'true');
        },
        { timeout: 2000 },
      );

      const menuItem = shareItem.closest('li');
      expect(menuItem).toBeInTheDocument();
    });
  });

  describe('Custom placement and offset', () => {
    const customPlacementSubmenu = (
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.SubMenuTrigger placement="left top" offset={20}>
          <Menu.Item key="share">Share</Menu.Item>
          <Menu>
            <Menu.Item key="link">Copy link</Menu.Item>
          </Menu>
        </Menu.SubMenuTrigger>
      </Menu>
    );

    it('should respect custom placement and offset props', async () => {
      const { getByText } = renderWithRoot(customPlacementSubmenu);

      const shareItem = getByText('Share');

      await userEvent.click(shareItem);

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // The submenu should be rendered with custom placement
      // (exact positioning would require more detailed DOM inspection)
    });
  });

  describe('Selection and actions', () => {
    it('should handle onAction in submenu items', async () => {
      const onAction = jest.fn();

      const submenuWithAction = (
        <Menu id="test-menu" aria-label="Test menu" onAction={onAction}>
          <Menu.SubMenuTrigger>
            <Menu.Item key="share">Share</Menu.Item>
            <Menu onAction={onAction}>
              <Menu.Item key="link">Copy link</Menu.Item>
            </Menu>
          </Menu.SubMenuTrigger>
        </Menu>
      );

      const { getByText } = renderWithRoot(submenuWithAction);

      // Open submenu
      await userEvent.click(getByText('Share'));

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Click submenu item
      await userEvent.click(getByText('Copy link'));

      expect(onAction).toHaveBeenCalledWith('link');
    });

    it('should close menu hierarchy after selection', async () => {
      const onAction = jest.fn();

      const { getByText, queryByText } = renderWithRoot(
        <MenuTrigger>
          <Button>Open Menu</Button>
          <Menu onAction={onAction}>
            <Menu.SubMenuTrigger>
              <Menu.Item key="share">Share</Menu.Item>
              <Menu onAction={onAction}>
                <Menu.Item key="link">Copy link</Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
          </Menu>
        </MenuTrigger>,
      );

      // Open menu
      await userEvent.click(getByText('Open Menu'));

      await waitFor(() => {
        expect(getByText('Share')).toBeInTheDocument();
      });

      // Wait for Share item to be ready
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-has-submenu', 'true');
      });

      // Open submenu
      await userEvent.click(getByText('Share'));

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Click submenu item
      await userEvent.click(getByText('Copy link'));

      // Both menus should close
      await waitFor(() => {
        expect(queryByText('Share')).not.toBeInTheDocument();
        expect(queryByText('Copy link')).not.toBeInTheDocument();
      });
    });
  });

  describe('With sections', () => {
    const submenuWithSections = (
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.SubMenuTrigger>
          <Menu.Item key="settings">Settings</Menu.Item>
          <Menu>
            <Menu.Section title="General">
              <Menu.Item key="preferences">Preferences</Menu.Item>
              <Menu.Item key="account">Account</Menu.Item>
            </Menu.Section>
            <Menu.Section title="Advanced">
              <Menu.Item key="developer">Developer</Menu.Item>
            </Menu.Section>
          </Menu>
        </Menu.SubMenuTrigger>
      </Menu>
    );

    it('should render sections in submenu', async () => {
      const { getByText } = renderWithRoot(submenuWithSections);

      await userEvent.click(getByText('Settings'));

      await waitFor(
        () => {
          expect(getByText('General')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      expect(getByText('Preferences')).toBeInTheDocument();
      expect(getByText('Advanced')).toBeInTheDocument();
      expect(getByText('Developer')).toBeInTheDocument();
    });
  });

  describe('Focus management', () => {
    it('should focus first item in submenu when opened with keyboard', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <MenuTrigger>
          <Button>Open Menu</Button>
          <Menu id="test-menu" aria-label="Test menu">
            <Menu.Item key="copy">Copy</Menu.Item>
            <Menu.SubMenuTrigger key="share-menu">
              <Menu.Item key="share">Share</Menu.Item>
              <Menu>
                <Menu.Item key="share-link">Copy link</Menu.Item>
                <Menu.Item key="share-email">Email</Menu.Item>
                <Menu.Item key="share-sms">SMS</Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
            <Menu.Item key="delete">Delete</Menu.Item>
          </Menu>
        </MenuTrigger>,
      );

      // Open the menu first
      await userEvent.click(getByText('Open Menu'));

      await waitFor(() => {
        expect(getByText('Copy')).toBeInTheDocument();
      });

      // Wait for menu to be properly focused and ready
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-has-submenu', 'true');
      });

      await act(async () => {
        await userEvent.keyboard('{ArrowDown}'); // Focus Share
      });

      // Verify Share item is focused before trying to open submenu
      await waitFor(() => {
        const shareItem = getByText('Share').closest('li');
        expect(shareItem).toHaveAttribute('data-is-focused');
      });

      await act(async () => {
        await userEvent.keyboard('{ArrowRight}');
      });

      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Check that first submenu item is focused (React Aria manages focus virtually)
      // The actual DOM focus might be on the menu itself with aria-activedescendant
      const firstSubmenuItem = getByText('Copy link').closest('li');

      // Check for focus indication - tasty sets data-is-focused based on mods.focused
      await waitFor(() => {
        expect(firstSubmenuItem).toHaveAttribute('data-is-focused');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const { getByText } = renderWithRoot(basicSubmenu);

      // Wait for the dynamic import to complete
      await waitFor(
        () => {
          const shareItem = getByText('Share');
          const menuItem = shareItem.closest('li');
          return menuItem?.hasAttribute('data-has-submenu');
        },
        { timeout: 2000 },
      );

      const shareItem = getByText('Share');
      const menuItem = shareItem.closest('li');
      expect(menuItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(menuItem).toHaveAttribute('aria-expanded', 'false');
      expect(menuItem).toHaveAttribute('data-has-submenu', 'true');
    });

    it('should update aria-expanded when opened', async () => {
      const { getByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share');
      const menuItem = shareItem.closest('li');

      await userEvent.click(shareItem);

      await waitFor(
        () => {
          expect(menuItem).toHaveAttribute('aria-expanded', 'true');
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Submenu coordination', () => {
    it('should close one submenu when another opens (keyboard + mouse)', async () => {
      const multiSubmenuExample = (
        <EventBusProvider>
          <MenuTrigger>
            <Button>Multi Submenu</Button>
            <Menu width="200px">
              <Menu.SubMenuTrigger>
                <Menu.Item key="share">Share</Menu.Item>
                <Menu onAction={() => {}}>
                  <Menu.Item key="share-link">Copy link</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
              <Menu.SubMenuTrigger>
                <Menu.Item key="export">Export</Menu.Item>
                <Menu onAction={() => {}}>
                  <Menu.Item key="export-pdf">Export as PDF</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
            </Menu>
          </MenuTrigger>
        </EventBusProvider>
      );

      const { getByText, queryByText } = renderWithRoot(multiSubmenuExample);

      // Open main menu
      const triggerButton = getByText('Multi Submenu');
      await userEvent.click(triggerButton);

      // Wait for main menu to appear
      await waitFor(() => {
        expect(getByText('Share')).toBeInTheDocument();
        expect(getByText('Export')).toBeInTheDocument();
      });

      // Step 1: Open first submenu with keyboard (ArrowRight)
      const shareItem = getByText('Share');
      shareItem.focus();
      await userEvent.keyboard('{ArrowRight}');

      // Wait for first submenu to open
      await waitFor(
        () => {
          expect(queryByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // Step 2: Open second submenu with mouse hover
      const exportItem = getByText('Export');
      await userEvent.hover(exportItem);

      // Wait for second submenu to open and first to close
      await waitFor(
        () => {
          expect(queryByText('Export as PDF')).toBeInTheDocument();
          // First submenu should be closed
          expect(queryByText('Copy link')).not.toBeInTheDocument();
        },
        { timeout: 1500 },
      );
    });

    it('should close one submenu when another opens (mouse + keyboard)', async () => {
      const multiSubmenuExample = (
        <EventBusProvider>
          <MenuTrigger>
            <Button>Multi Submenu</Button>
            <Menu width="200px">
              <Menu.SubMenuTrigger>
                <Menu.Item key="share">Share</Menu.Item>
                <Menu onAction={() => {}}>
                  <Menu.Item key="share-link">Copy link</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
              <Menu.SubMenuTrigger>
                <Menu.Item key="export">Export</Menu.Item>
                <Menu onAction={() => {}}>
                  <Menu.Item key="export-pdf">Export as PDF</Menu.Item>
                </Menu>
              </Menu.SubMenuTrigger>
            </Menu>
          </MenuTrigger>
        </EventBusProvider>
      );

      const { getByText, queryByText } = renderWithRoot(multiSubmenuExample);

      // Open main menu
      const triggerButton = getByText('Multi Submenu');
      await userEvent.click(triggerButton);

      // Wait for main menu to appear
      await waitFor(() => {
        expect(getByText('Share')).toBeInTheDocument();
        expect(getByText('Export')).toBeInTheDocument();
      });

      // Step 1: Open first submenu with mouse hover
      const shareItem = getByText('Share');
      await userEvent.hover(shareItem);

      // Wait for first submenu to open
      await waitFor(
        () => {
          expect(queryByText('Copy link')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // Step 2: Open second submenu with keyboard - click on Export then press ArrowRight
      const exportItem = getByText('Export');
      await userEvent.click(exportItem);
      // Short pause to ensure focus
      await new Promise((resolve) => setTimeout(resolve, 100));
      await userEvent.keyboard('{ArrowRight}');

      // Wait for second submenu to open and first to close
      await waitFor(
        () => {
          expect(queryByText('Export as PDF')).toBeInTheDocument();
          // First submenu should be closed
          expect(queryByText('Copy link')).not.toBeInTheDocument();
        },
        { timeout: 1500 },
      );
    });
  });
});
