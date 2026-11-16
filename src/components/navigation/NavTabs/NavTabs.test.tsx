import { render, userEvent, within } from '../../../test';
import { Root } from '../../Root';

import { NavTabs } from './NavTabs';

import type { CubeNavTabsProps } from './NavTabs';

vi.mock('../../../_internal/hooks/use-warn');

describe('<NavTabs />', () => {
  const usersTo = { pathname: '/users', search: '?page=2' };

  function renderNavTabs(props: Partial<CubeNavTabsProps> = {}) {
    const navigate = vi.fn();
    const utils = render(
      <Root
        navigation={{
          useHref: (to) =>
            `/app${typeof to === 'string' ? to : `${to.pathname}${to.search}`}`,
          useNavigate: () => navigate,
        }}
      >
        <NavTabs label="Tenant" activeKey="profile" {...props}>
          <NavTabs.Item key="profile" to="/profile">
            Profile
          </NavTabs.Item>
          <NavTabs.Item key="users" to={usersTo}>
            Users
          </NavTabs.Item>
          <NavTabs.Item key="preview" to="/preview" isDisabled>
            Preview
          </NavTabs.Item>
        </NavTabs>
      </Root>,
    );

    return { ...utils, navigate };
  }

  it('renders a navigation landmark with a list of links', () => {
    const { getByRole, queryByRole } = renderNavTabs();
    const nav = getByRole('navigation', { name: 'Tenant' });
    const items = within(nav).getAllByRole('listitem');

    expect(within(nav).getByRole('list')).toBeInTheDocument();
    expect(items).toHaveLength(3);
    expect(within(nav).getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/app/profile',
    );
    expect(within(nav).getByRole('link', { name: 'Users' })).toHaveAttribute(
      'href',
      '/app/users?page=2',
    );
    // Link semantics, not tab semantics.
    expect(queryByRole('tablist')).not.toBeInTheDocument();
    expect(queryByRole('tab')).not.toBeInTheDocument();
  });

  it('marks only the current item, with `aria-current`', () => {
    const { getByRole, rerender, navigate } = renderNavTabs();
    const profile = getByRole('link', { name: 'Profile' });
    const users = getByRole('link', { name: 'Users' });

    expect(profile).toHaveAttribute('aria-current', 'page');
    expect(users).not.toHaveAttribute('aria-current');
    // `aria-selected` is not a state a link has.
    expect(profile).not.toHaveAttribute('aria-selected');

    rerender(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <NavTabs label="Tenant" activeKey="users">
          <NavTabs.Item key="profile" to="/profile">
            Profile
          </NavTabs.Item>
          <NavTabs.Item key="users" to="/users">
            Users
          </NavTabs.Item>
        </NavTabs>
      </Root>,
    );

    expect(getByRole('link', { name: 'Users' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(getByRole('link', { name: 'Profile' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('routes a plain click once through the navigation adapter', async () => {
    const { getByRole, navigate } = renderNavTabs();

    await userEvent.click(getByRole('link', { name: 'Users' }));

    expect(navigate).toHaveBeenCalledExactlyOnceWith(usersTo, undefined);
  });

  it('gives a disabled item no destination', async () => {
    const { getByRole, queryByRole, navigate } = renderNavTabs();
    const preview = getByRole('button', { name: 'Preview' });

    expect(queryByRole('link', { name: 'Preview' })).not.toBeInTheDocument();
    expect(preview).toBeDisabled();
    expect(preview).not.toHaveAttribute('href');

    await userEvent.click(preview);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders only keyed `NavTabs.Item` children', () => {
    const { getByRole } = render(
      <Root>
        <NavTabs label="Tenant">
          <NavTabs.Item key="profile" to="/profile">
            Profile
          </NavTabs.Item>
          <div key="stray">Stray</div>
          <NavTabs.Item to="/users">Users</NavTabs.Item>
        </NavTabs>
      </Root>,
    );

    const nav = getByRole('navigation', { name: 'Tenant' });

    expect(within(nav).getAllByRole('listitem')).toHaveLength(1);
    expect(within(nav).queryByText('Stray')).not.toBeInTheDocument();
    expect(within(nav).queryByText('Users')).not.toBeInTheDocument();
  });

  it('names its parts for QA', () => {
    const { getByTestId } = renderNavTabs({ qa: 'TenantNav' });

    expect(getByTestId('TenantNav').tagName).toBe('NAV');
    expect(getByTestId('NavTab-users')).toHaveAttribute('data-key', 'users');
  });
});
