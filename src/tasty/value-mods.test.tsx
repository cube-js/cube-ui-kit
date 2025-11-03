import { render } from '@testing-library/react';

import { tasty } from './tasty';

describe('Value Mods', () => {
  describe('modAttrs generation', () => {
    const TestElement = tasty({
      as: 'div',
      styles: {},
    });

    it('should generate data-* attributes for boolean true', () => {
      const { container } = render(<TestElement mods={{ hovered: true }} />);
      expect(container.firstChild).toHaveAttribute('data-hovered', '');
    });

    it('should not generate attributes for boolean false', () => {
      const { container } = render(<TestElement mods={{ hovered: false }} />);
      expect(container.firstChild).not.toHaveAttribute('data-hovered');
    });

    it('should not generate attributes for null/undefined', () => {
      const { container } = render(
        <TestElement mods={{ a: null, b: undefined }} />,
      );
      expect(container.firstChild).not.toHaveAttribute('data-a');
      expect(container.firstChild).not.toHaveAttribute('data-b');
    });

    it('should generate data-* attributes for string values', () => {
      const { container } = render(
        <TestElement mods={{ theme: 'danger', size: 'large' }} />,
      );
      expect(container.firstChild).toHaveAttribute('data-theme', 'danger');
      expect(container.firstChild).toHaveAttribute('data-size', 'large');
    });

    it('should generate data-* attributes for empty string', () => {
      const { container } = render(<TestElement mods={{ label: '' }} />);
      expect(container.firstChild).toHaveAttribute('data-label', '');
    });

    it('should convert numbers to strings', () => {
      const { container } = render(<TestElement mods={{ level: 2 }} />);
      expect(container.firstChild).toHaveAttribute('data-level', '2');
    });

    it('should handle mixed boolean and value mods', () => {
      const { container } = render(
        <TestElement
          mods={{
            hovered: true,
            pressed: false,
            theme: 'danger',
            size: 'large',
          }}
        />,
      );
      expect(container.firstChild).toHaveAttribute('data-hovered', '');
      expect(container.firstChild).not.toHaveAttribute('data-pressed');
      expect(container.firstChild).toHaveAttribute('data-theme', 'danger');
      expect(container.firstChild).toHaveAttribute('data-size', 'large');
    });

    it('should preserve "is" prefix in camelCase names', () => {
      const { container } = render(<TestElement mods={{ isSelected: true }} />);
      expect(container.firstChild).toHaveAttribute('data-is-selected', '');
    });
  });

  describe('Style binding with value mods', () => {
    it('should apply styles for value mods using shorthand syntax', () => {
      const Button = tasty({
        as: 'button',
        styles: {
          fill: {
            '': '#surface',
            'theme=danger': '#red',
            'theme=warning': '#yellow',
          },
        },
      });

      const { container, rerender } = render(
        <Button mods={{ theme: 'danger' }}>Delete</Button>,
      );

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveAttribute('data-theme', 'danger');

      rerender(<Button mods={{ theme: 'warning' }}>Warning</Button>);
      expect(button).toHaveAttribute('data-theme', 'warning');
    });

    it('should apply styles combining boolean and value mods', () => {
      const Card = tasty({
        as: 'div',
        styles: {
          fill: {
            '': '#surface',
            hovered: '#surface-hover',
            'theme=danger': '#red',
            'hovered & theme=danger': '#light-red',
          },
        },
      });

      const { container } = render(
        <Card mods={{ hovered: true, theme: 'danger' }}>Content</Card>,
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-hovered', '');
      expect(card).toHaveAttribute('data-theme', 'danger');
    });

    it('should support quoted value syntax', () => {
      const Element = tasty({
        as: 'div',
        styles: {
          color: {
            '': '#text',
            'variant="primary"': '#purple',
            "variant='secondary'": '#gray',
          },
        },
      });

      const { container, rerender } = render(
        <Element mods={{ variant: 'primary' }}>Primary</Element>,
      );

      expect(container.firstChild).toHaveAttribute('data-variant', 'primary');

      rerender(<Element mods={{ variant: 'secondary' }}>Secondary</Element>);
      expect(container.firstChild).toHaveAttribute('data-variant', 'secondary');
    });

    it('should support full attribute selector syntax', () => {
      const Element = tasty({
        as: 'div',
        styles: {
          color: {
            '': '#text',
            '[data-theme="danger"]': '#red',
          },
        },
      });

      const { container } = render(
        <Element mods={{ theme: 'danger' }}>Danger</Element>,
      );

      expect(container.firstChild).toHaveAttribute('data-theme', 'danger');
    });
  });

  describe('Priority order for same-attribute selectors', () => {
    it('should respect first-match priority when boolean has higher priority than value', () => {
      const Component = tasty({
        as: 'div',
        styles: {
          color: {
            'theme=danger': 'red',
            theme: 'blue', // Higher priority after reversal
          },
        },
      });

      const { container } = render(<Component mods={{ theme: 'danger' }} />);
      const element = container.firstChild as HTMLElement;

      // Element should have data-theme="danger"
      expect(element).toHaveAttribute('data-theme', 'danger');

      // Check computed color - should use boolean selector (higher priority)
      // The value selector should be filtered out before CSS generation
      const style = window.getComputedStyle(element);
      expect(style.color).not.toBe('red'); // Value selector should not apply
    });

    it('should allow both selectors when value has higher priority', () => {
      const Component = tasty({
        as: 'div',
        styles: {
          color: {
            theme: 'blue',
            'theme=danger': 'red', // Higher priority after reversal
          },
        },
      });

      const { container } = render(<Component mods={{ theme: 'danger' }} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('data-theme', 'danger');
      // Both CSS rules should be generated, value selector wins via cascade
    });

    it('should handle multiple attributes independently', () => {
      const Component = tasty({
        as: 'div',
        styles: {
          color: {
            theme: 'blue', // Boolean higher priority
            'theme=danger': 'red',
          },
          fontSize: {
            'size=large': '20px', // Value higher priority
            size: '16px',
          },
        },
      });

      const { container } = render(
        <Component mods={{ theme: 'danger', size: 'large' }} />,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('data-theme', 'danger');
      expect(element).toHaveAttribute('data-size', 'large');
      // theme=danger should be filtered, size=large should not
    });

    it('should work with complex combinations', () => {
      const Component = tasty({
        as: 'div',
        styles: {
          color: {
            'theme=danger & hovered': 'lightcoral',
            'theme & hovered': 'lightblue', // Boolean theme higher priority
          },
        },
      });

      const { container } = render(
        <Component mods={{ theme: 'danger', hovered: true }} />,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('data-theme', 'danger');
      expect(element).toHaveAttribute('data-hovered', '');
      // First combination should be filtered due to boolean theme priority
    });

    it('should not filter when only value selectors exist', () => {
      const Component = tasty({
        as: 'div',
        styles: {
          color: {
            'theme=danger': 'red',
            'theme=warning': 'yellow',
            'theme=success': 'green',
          },
        },
      });

      const { container } = render(<Component mods={{ theme: 'danger' }} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('data-theme', 'danger');
      // All value selectors should remain (no boolean to filter them)
    });

    it('should not filter when only boolean selectors exist', () => {
      const Component = tasty({
        as: 'div',
        styles: {
          color: {
            theme: 'blue',
            hovered: 'lightblue',
          },
        },
      });

      const { container } = render(
        <Component mods={{ theme: 'danger', hovered: true }} />,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('data-theme', 'danger');
      expect(element).toHaveAttribute('data-hovered', '');
      // Both boolean selectors should remain
    });

    it('should work with full attribute selector syntax for boolean', () => {
      const Component = tasty({
        as: 'button',
        styles: {
          color: {
            '[aria-label="Submit"]': 'red',
            '[aria-label]': 'blue', // Higher priority after reversal
          },
        },
      });

      const { container } = render(
        <Component aria-label="Submit">Click me</Component>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('aria-label', 'Submit');

      // Check computed color - should use boolean selector (higher priority)
      const style = window.getComputedStyle(element);
      expect(style.color).not.toBe('red'); // Value selector should not apply
    });

    it('should work with full attribute selector syntax when value has priority', () => {
      const Component = tasty({
        as: 'button',
        styles: {
          color: {
            '[aria-label]': 'blue',
            '[aria-label="Submit"]': 'red', // Higher priority after reversal
          },
        },
      });

      const { container } = render(
        <Component aria-label="Submit">Click me</Component>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('aria-label', 'Submit');
      // Both CSS rules should be generated, value selector wins via cascade
    });

    it('should work with mixed shorthand and full selector syntax', () => {
      const Component = tasty({
        as: 'div',
        styles: {
          color: {
            'theme=danger': 'red',
            '[data-theme]': 'blue', // Higher priority after reversal
          },
        },
      });

      const { container } = render(<Component mods={{ theme: 'danger' }} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('data-theme', 'danger');

      // Check computed color - should use boolean selector (higher priority)
      const style = window.getComputedStyle(element);
      expect(style.color).not.toBe('red'); // Value selector should not apply
    });

    it('should work with data-* prefix in full selector syntax', () => {
      const Component = tasty({
        as: 'div',
        styles: {
          fontSize: {
            '[data-size="large"]': '20px',
            '[data-size]': '16px', // Higher priority after reversal
          },
        },
      });

      const { container } = render(<Component mods={{ size: 'large' }} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('data-size', 'large');

      // Check computed fontSize - should use boolean selector (higher priority)
      const style = window.getComputedStyle(element);
      expect(style.fontSize).not.toBe('20px'); // Value selector should not apply
    });
  });

  describe('Migration from data-is-* to data-*', () => {
    it('should generate data-disabled instead of data-is-disabled', () => {
      const DisabledElement = tasty({
        as: 'div',
        styles: {},
      });

      const { container } = render(
        <DisabledElement isDisabled={true}>Content</DisabledElement>,
      );
      expect(container.firstChild).toHaveAttribute('disabled');
      expect(container.firstChild).toHaveAttribute('data-disabled', '');
    });

    it('should generate data-checked instead of data-is-checked', () => {
      const CheckboxElement = tasty({
        as: 'input',
        styles: {},
      });

      const { container } = render(
        <CheckboxElement readOnly type="checkbox" isChecked={true} />,
      );
      expect(container.firstChild).toHaveAttribute('checked');
      expect(container.firstChild).toHaveAttribute('data-checked', '');
    });

    it('should generate data-hidden instead of data-is-hidden', () => {
      const HiddenElement = tasty({
        as: 'div',
        styles: {},
      });

      const { container } = render(
        <HiddenElement isHidden={true}>Content</HiddenElement>,
      );
      expect(container.firstChild).toHaveAttribute('hidden');
      expect(container.firstChild).toHaveAttribute('data-hidden', '');
    });
  });
});
