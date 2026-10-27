import { render, screen, userEvent } from '../../../test';
import { Root } from '../../Root';

import { TableRowLink } from './TableRowLink';

import type {
  NavigateArg,
  NavigationAdapter,
} from '../../../providers/navigation.types';

describe('TableRowLink destinations', () => {
  const navigate = vi.fn();
  const track = vi.fn();
  const navigation: NavigationAdapter = {
    useHref: (to) =>
      typeof to === 'string' ? to : `${to.pathname}?${to.search}#${to.hash}`,
    useNavigate: () => navigate,
  };

  function link(to: NavigateArg) {
    return (
      <Root navigation={navigation} tracking={{ event: track }}>
        <TableRowLink to={to}>
          {(props) => <a {...props}>Open record</a>}
        </TableRowLink>
      </Root>
    );
  }

  beforeEach(() => {
    navigate.mockClear();
    track.mockClear();
  });

  it('uses the latest router destination and tracks one ordinary activation', async () => {
    const { rerender } = render(link('/records/old'));
    rerender(
      link({ pathname: '/records/new', search: 'view=all', hash: 'title' }),
    );
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', '/records/new?view=all#title');
    await userEvent.click(anchor);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(
      {
        pathname: '/records/new',
        search: 'view=all',
        hash: 'title',
      },
      undefined,
    );
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('retains history destinations, including zero', async () => {
    const { rerender } = render(link(-1));
    await userEvent.click(screen.getByRole('link'));
    expect(navigate).toHaveBeenLastCalledWith(-1);
    rerender(link(0));
    await userEvent.click(screen.getByRole('link'));
    expect(navigate).toHaveBeenLastCalledWith(0);
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('retains smooth hash navigation without sending it to the router', async () => {
    render(
      <>
        {link('#record-details')}
        <section id="record-details">Details</section>
      </>,
    );
    const target = screen.getByText('Details');
    const scroll = vi.fn();
    target.scrollIntoView = scroll;
    await userEvent.click(screen.getByRole('link'));
    expect(scroll).toHaveBeenCalledExactlyOnceWith({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['!https://example.com/record', 'https://example.com/record', '_blank'],
    ['@/native-record', '/native-record', null],
    ['@', '', null],
  ])('exposes native destination %s', (to, href, target) => {
    render(link(to));
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', href);
    expect(anchor.getAttribute('target')).toBe(target);
  });
});
