import { render } from '@testing-library/react';
import { useRef } from 'react';

import { useRowMoveAnimation } from './use-row-move-animation';

function Rows({ isEnabled, order }: { isEnabled: boolean; order: string[] }) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  useRowMoveAnimation({ isEnabled, bodyRef });

  return (
    <table>
      <tbody ref={bodyRef}>
        {order.map((key) => (
          <tr key={key} data-element="Row" data-key={key}>
            <td>{key}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

describe('row move animation lifecycle', () => {
  it('skips position reads while disabled and starts from fresh positions when enabled', () => {
    const positions = vi
      .spyOn(HTMLElement.prototype, 'offsetTop', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return Array.from(this.parentElement!.children).indexOf(this) * 40;
      });

    try {
      const { rerender, container, unmount } = render(
        <Rows isEnabled={false} order={['a', 'b']} />,
      );
      rerender(<Rows isEnabled={false} order={['b', 'a']} />);
      expect(positions).not.toHaveBeenCalled();

      rerender(<Rows isEnabled order={['a', 'b']} />);
      const row = container.querySelector<HTMLElement>('[data-key="a"]')!;
      expect(row.style.transition).toBe('');

      rerender(<Rows isEnabled order={['b', 'a']} />);
      expect(row.style.transition).toBe('transform 120ms ease-out');

      rerender(<Rows isEnabled={false} order={['b', 'a']} />);
      expect(row.style.transition).toBe('');
      unmount();
    } finally {
      positions.mockRestore();
    }
  });
});
