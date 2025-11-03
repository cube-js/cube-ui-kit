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
        <CheckboxElement type="checkbox" isChecked={true} />,
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
