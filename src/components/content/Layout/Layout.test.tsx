import { render, screen } from '@testing-library/react';

import { Root } from '../../Root';

import { GridLayout, Layout } from './index';

const renderWithRoot = (children: React.ReactNode) => {
  return render(<Root>{children}</Root>);
};

describe('Layout', () => {
  it('renders Layout with children', () => {
    renderWithRoot(
      <Layout>
        <div data-qa="child">Content</div>
      </Layout>,
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders Layout with header', () => {
    renderWithRoot(
      <Layout>
        <Layout.Header title="Test Title" />
      </Layout>,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders Layout with header subtitle', () => {
    renderWithRoot(
      <Layout>
        <Layout.Header title="Title" subtitle="Subtitle text" />
      </Layout>,
    );

    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders Layout with toolbar', () => {
    renderWithRoot(
      <Layout>
        <Layout.Toolbar>
          <button>Action</button>
        </Layout.Toolbar>
      </Layout>,
    );

    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders Layout with footer', () => {
    renderWithRoot(
      <Layout>
        <Layout.Footer>
          <span>Footer content</span>
        </Layout.Footer>
      </Layout>,
    );

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders Layout with content', () => {
    renderWithRoot(
      <Layout>
        <Layout.Content>
          <div>Content text</div>
        </Layout.Content>
      </Layout>,
    );

    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('renders Layout.Panel', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <div>Panel text</div>
        </Layout.Panel>
      </Layout>,
    );

    expect(screen.getByText('Panel text')).toBeInTheDocument();
  });

  it('renders Layout.PanelHeader', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <Layout.PanelHeader title="Panel Title" />
        </Layout.Panel>
      </Layout>,
    );

    expect(screen.getByText('Panel Title')).toBeInTheDocument();
  });

  it('renders Layout.PanelHeader with close button', () => {
    const onClose = jest.fn();

    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <Layout.PanelHeader isClosable title="Panel" onClose={onClose} />
        </Layout.Panel>
      </Layout>,
    );

    const closeButton = screen.getByLabelText('Close panel');
    expect(closeButton).toBeInTheDocument();
  });

  it('does not render closed panel without transition', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200} isOpen={false}>
          <div>Panel content</div>
        </Layout.Panel>
      </Layout>,
    );

    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });
});

describe('GridLayout', () => {
  it('renders GridLayout with children', () => {
    renderWithRoot(
      <GridLayout columns="1fr 1fr" gap="2x">
        <div>Grid content</div>
      </GridLayout>,
    );

    expect(screen.getByText('Grid content')).toBeInTheDocument();
  });

  it('has all Layout sub-components', () => {
    expect(GridLayout.Toolbar).toBeDefined();
    expect(GridLayout.Header).toBeDefined();
    expect(GridLayout.Footer).toBeDefined();
    expect(GridLayout.Content).toBeDefined();
    expect(GridLayout.Panel).toBeDefined();
    expect(GridLayout.PanelHeader).toBeDefined();
  });
});

describe('Layout.Header breadcrumbs', () => {
  it('renders breadcrumbs', () => {
    renderWithRoot(
      <Layout>
        <Layout.Header
          title="Current Page"
          breadcrumbs={[
            ['Home', '/'],
            ['Parent', '/parent'],
          ]}
        />
      </Layout>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
    // Title appears twice - once in breadcrumbs and once in title
    expect(screen.getAllByText('Current Page')).toHaveLength(2);
  });
});
