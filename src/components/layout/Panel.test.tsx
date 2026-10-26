import { render, screen } from '../../test';

import { Panel } from './Panel';

describe('<Panel />', () => {
  it('updates its modifiers when isFloating and isFlex change after mount', () => {
    const { rerender } = render(<Panel qa="panel" />);

    expect(screen.getByTestId('panel')).not.toHaveAttribute('data-floating');
    expect(screen.getByTestId('panel')).not.toHaveAttribute('data-flex');

    rerender(<Panel isFloating isFlex qa="panel" />);

    expect(screen.getByTestId('panel')).toHaveAttribute('data-floating');
    expect(screen.getByTestId('panel')).toHaveAttribute('data-flex');
  });

  describe('inner style props', () => {
    it('keep innerStyles when passed as undefined', () => {
      render(
        <Panel qa="panel" padding={undefined} innerStyles={{ padding: '2em' }}>
          content
        </Panel>,
      );

      const inner = screen.getByTestId('panel').firstElementChild!;

      expect(getComputedStyle(inner).padding).toBe('2em');
    });

    it('replace the same key in innerStyles with a state map', () => {
      // Without a `''` key, a merge would keep `innerStyles`' `2em`; replaced,
      // the inner element has no padding outside `card`.
      render(
        <Panel
          qa="panel"
          padding={{ card: '1em' }}
          innerStyles={{ padding: '2em' }}
        >
          content
        </Panel>,
      );

      const inner = screen.getByTestId('panel').firstElementChild!;

      expect(getComputedStyle(inner).padding).toBe('0');
    });

    it('apply a falsy value to the inner element', () => {
      render(
        <Panel qa="panel" padding={0} innerStyles={{ padding: '2em' }}>
          content
        </Panel>,
      );

      const inner = screen.getByTestId('panel').firstElementChild!;

      expect(getComputedStyle(inner).padding).toBe('0px');
    });
  });
});
