import { renderWithRoot } from '../../test';

import { Panel } from './Panel';

describe('Panel inner style props', () => {
  it('keep innerStyles when passed as undefined', () => {
    const { container } = renderWithRoot(
      <div style={{ position: 'relative', height: 100 }}>
        <Panel padding={undefined} innerStyles={{ padding: '3x' }}>
          content
        </Panel>
      </div>,
    );

    const inner = container.querySelector('section > div')!;

    expect(getComputedStyle(inner).padding).toBe('24px');
  });

  it('apply a falsy value to the inner element', () => {
    const { container } = renderWithRoot(
      <div style={{ position: 'relative', height: 100 }}>
        <Panel padding={0} innerStyles={{ padding: '3x' }}>
          content
        </Panel>
      </div>,
    );

    const inner = container.querySelector('section > div')!;

    expect(getComputedStyle(inner).padding).toBe('0px');
  });
});
