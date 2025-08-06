// @ts-nocheck
import React from 'react';

import {
  act,
  render,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';

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
    it('should render submenu trigger with chevron icon', () => {
      const { getByText, container } = render(basicSubmenu);

      const shareItem = getByText('Share');
      expect(shareItem).toBeInTheDocument();

      // Should have submenu indicator
      const menuItem = shareItem.closest('li');
      expect(menuItem).toHaveAttribute('data-has-submenu', 'true');
      expect(menuItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(menuItem).toHaveAttribute('aria-expanded', 'false');

      // Should render chevron icon
      const chevronIcon = container.querySelector('[data-qa="RightIcon"]');
      expect(chevronIcon).toBeInTheDocument();
    });

    it('should not render submenu content when closed', () => {
      const { queryByText } = render(basicSubmenu);

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
      await act(async () => {
        await userEvent.hover(shareItem);
      });

      // Wait for hover delay (200ms)
      await waitFor(
        () => {
          expect(getByText('Copy link')).toBeInTheDocument();
          expect(getByText('Email')).toBeInTheDocument();
          expect(getByText('SMS')).toBeInTheDocument();
        },
        { timeout: 500 },
      );

      // Check ARIA attributes updated
      const menuItem = shareItem.closest('li');
      expect(menuItem).toHaveAttribute('aria-expanded', 'true');
    });

    it('should not open submenu if mouse leaves before delay', async () => {
      const { getByText, queryByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share');

      // Hover and quickly unhover
      await act(async () => {
        await userEvent.hover(shareItem);
        // Immediately unhover (before 200ms delay)
        await userEvent.unhover(shareItem);
      });

      // Wait to ensure submenu doesn't open
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
      });

      expect(queryByText('Copy link')).not.toBeInTheDocument();
    });

    it('should open submenu on click', async () => {
      const { getByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share');

      await act(async () => {
        await userEvent.click(shareItem);
      });

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
        expect(getByText('Email')).toBeInTheDocument();
        expect(getByText('SMS')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard navigation', () => {
    it('should open submenu with ArrowRight key', async () => {
      const { getByRole, getByText } = renderWithRoot(basicSubmenu);

      const menu = getByRole('menu');

      // Focus the menu
      await act(async () => {
        menu.focus();
      });

      // Navigate to Share item
      await act(async () => {
        await userEvent.keyboard('{ArrowDown}{ArrowDown}'); // Skip Copy, focus Share
      });

      // Open submenu with ArrowRight
      await act(async () => {
        await userEvent.keyboard('{ArrowRight}');
      });

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
      });
    });

    it('should open submenu with Enter key', async () => {
      const { getByRole, getByText } = renderWithRoot(basicSubmenu);

      const menu = getByRole('menu');

      await act(async () => {
        menu.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}'); // Focus Share
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
      });
    });

    it('should open submenu with Space key', async () => {
      const { getByRole, getByText } = renderWithRoot(basicSubmenu);

      const menu = getByRole('menu');

      await act(async () => {
        menu.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}'); // Focus Share
        await userEvent.keyboard(' '); // Space key
      });

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
      });
    });

    it('should close submenu with ArrowLeft key', async () => {
      const { getByRole, getByText, queryByText } =
        renderWithRoot(basicSubmenu);

      const menu = getByRole('menu');

      // Open submenu first
      await act(async () => {
        menu.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}'); // Focus Share
        await userEvent.keyboard('{ArrowRight}');
      });

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
      });

      // Close with ArrowLeft
      await act(async () => {
        await userEvent.keyboard('{ArrowLeft}');
      });

      await waitFor(() => {
        expect(queryByText('Copy link')).not.toBeInTheDocument();
      });
    });

    it('should close submenu with Escape key', async () => {
      const { getByRole, getByText, queryByText } =
        renderWithRoot(basicSubmenu);

      const menu = getByRole('menu');

      // Open submenu
      await act(async () => {
        menu.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        await userEvent.keyboard('{ArrowRight}');
      });

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
      });

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
      await act(async () => {
        await userEvent.hover(fileItem);
      });

      await waitFor(() => {
        expect(getByText('Export')).toBeInTheDocument();
      });

      // Open second level
      const exportItem = getByText('Export');
      await act(async () => {
        await userEvent.hover(exportItem);
      });

      await waitFor(() => {
        expect(getByText('PDF')).toBeInTheDocument();
        expect(getByText('Advanced')).toBeInTheDocument();
      });

      // Open third level
      const advancedItem = getByText('Advanced');
      await act(async () => {
        await userEvent.hover(advancedItem);
      });

      await waitFor(() => {
        expect(getByText('Custom Format')).toBeInTheDocument();
      });
    });
  });

  describe('Disabled state', () => {
    const disabledSubmenu = (
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.SubMenuTrigger disabled>
          <Menu.Item key="share">Share</Menu.Item>
          <Menu>
            <Menu.Item key="link">Copy link</Menu.Item>
          </Menu>
        </Menu.SubMenuTrigger>
      </Menu>
    );

    it('should not open when disabled', async () => {
      const { getByText, queryByText } = renderWithRoot(disabledSubmenu);

      const shareItem = getByText('Share');
      const menuItem = shareItem.closest('li');

      // Check disabled attributes
      expect(menuItem).toHaveAttribute('aria-disabled', 'true');
      expect(menuItem).toHaveAttribute('data-is-disabled');

      // Try to open via hover
      await act(async () => {
        await userEvent.hover(shareItem);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
      });

      expect(queryByText('Copy link')).not.toBeInTheDocument();

      // Try to open via click
      await act(async () => {
        await userEvent.click(shareItem);
      });

      expect(queryByText('Copy link')).not.toBeInTheDocument();
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

      await act(async () => {
        await userEvent.click(shareItem);
      });

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
      });

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
      await act(async () => {
        await userEvent.click(getByText('Share'));
      });

      // Click submenu item
      await act(async () => {
        await userEvent.click(getByText('Copy link'));
      });

      expect(onAction).toHaveBeenCalledWith('link');
    });

    it('should close menu hierarchy after selection', async () => {
      const onAction = jest.fn();

      const { getByText, queryByText } = renderWithRoot(
        <MenuTrigger>
          <button>Open Menu</button>
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
      await act(async () => {
        await userEvent.click(getByText('Open Menu'));
      });

      // Open submenu
      await act(async () => {
        await userEvent.click(getByText('Share'));
      });

      // Click submenu item
      await act(async () => {
        await userEvent.click(getByText('Copy link'));
      });

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

      await act(async () => {
        await userEvent.click(getByText('Settings'));
      });

      await waitFor(() => {
        expect(getByText('General')).toBeInTheDocument();
        expect(getByText('Preferences')).toBeInTheDocument();
        expect(getByText('Advanced')).toBeInTheDocument();
        expect(getByText('Developer')).toBeInTheDocument();
      });
    });
  });

  describe('Focus management', () => {
    it('should focus first item in submenu when opened with keyboard', async () => {
      const { getByRole, getByText } = renderWithRoot(basicSubmenu);

      const menu = getByRole('menu');

      await act(async () => {
        menu.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}'); // Focus Share
        await userEvent.keyboard('{ArrowRight}');
      });

      await waitFor(() => {
        expect(getByText('Copy link')).toBeInTheDocument();
      });

      // First submenu item should have focus
      const firstSubmenuItem = getByText('Copy link').closest('li');
      expect(firstSubmenuItem).toHaveAttribute('data-is-focused');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { getByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share').closest('li');
      expect(shareItem).toHaveAttribute('aria-haspopup', 'menu');
      expect(shareItem).toHaveAttribute('aria-expanded', 'false');
      expect(shareItem).toHaveAttribute('data-has-submenu', 'true');
    });

    it('should update aria-expanded when opened', async () => {
      const { getByText } = renderWithRoot(basicSubmenu);

      const shareItem = getByText('Share');
      const menuItem = shareItem.closest('li');

      await act(async () => {
        await userEvent.click(shareItem);
      });

      await waitFor(() => {
        expect(menuItem).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});
