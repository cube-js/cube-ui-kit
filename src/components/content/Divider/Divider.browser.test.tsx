import { renderWithRoot, screen } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Grid } from '../../layout/Grid';
import { Space } from '../../layout/Space';

import { Divider } from './Divider';

/**
 * Placement and size are layout, which jsdom does not compute — hence the
 * browser tier.
 */
function rect(qa: string) {
  return screen.getByTestId(qa).getBoundingClientRect();
}

function middle(box: DOMRect) {
  return box.top + box.height / 2;
}

describe('Divider layout', () => {
  it('takes the next cell of a grid', () => {
    // A `divider` grid area that no grid defines used to put it in a stray
    // column with no width, and push the next cell out of the grid.
    renderWithRoot(
      <Grid qa="Grid" columns="1fr 1fr" width="40x">
        <div data-qa="First">First</div>
        <Divider qa="Line" />
        <div data-qa="Next">Next</div>
      </Grid>,
    );

    const grid = rect('Grid');
    const line = rect('Line');
    const next = rect('Next');

    expect(line.left).toBeGreaterThan(grid.left);
    expect(line.right).toBeCloseTo(grid.right, 0);
    expect(line.width).toBeGreaterThan(0);
    expect(next.left).toBeCloseTo(grid.left, 0);
    expect(next.top).toBeGreaterThan(line.top);
  });

  it('takes its length from inlineSize', () => {
    renderWithRoot(
      <Space qa="Column" flow="column" width="40x">
        <Divider qa="Plain" inlineSize="50%" />
        <Divider qa="Text" inlineSize="50%">
          or
        </Divider>
      </Space>,
    );

    const half = rect('Column').width / 2;

    expect(rect('Plain').width).toBeCloseTo(half, 0);
    expect(rect('Text').width).toBeCloseTo(half, 0);
  });

  it('stretches across a row that centers its items', () => {
    renderWithRoot(
      <Space qa="Row" placeItems="center" height="10x">
        <Button>Edit</Button>
        <Divider qa="Line" orientation="vertical" />
      </Space>,
    );

    expect(rect('Line').height).toBeCloseTo(rect('Row').height, 0);
    expect(rect('Line').width).toBeGreaterThan(0);
  });

  it('keeps a height of its own centered in the row', () => {
    renderWithRoot(
      <Space qa="Row" placeItems="center" height="10x">
        <Button qa="Edit">Edit</Button>
        <Divider qa="Short" orientation="vertical" height="3x" />
        <Divider qa="Block" orientation="vertical" blockSize="2x" />
      </Space>,
    );

    const row = rect('Row');
    const short = rect('Short');
    const block = rect('Block');

    expect(short.height).toBeLessThan(row.height);
    expect(middle(short)).toBeCloseTo(middle(rect('Edit')), 0);
    expect(block.height).toBeLessThan(short.height);
    expect(middle(block)).toBeCloseTo(middle(row), 0);
  });
});
