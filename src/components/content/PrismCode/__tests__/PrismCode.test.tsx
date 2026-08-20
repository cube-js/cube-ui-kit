import { render } from '@testing-library/react';
import React, { act } from 'react';

import { PrismDiffCode } from '../../PrismDiffCode/PrismDiffCode';
import { PrismCode } from '../PrismCode';

describe('PrismCode component', () => {
  test('renders diff code with nested SQL highlighting', async () => {
    const code = `+SELECT id, name FROM users WHERE active = 1;
-SELECT * FROM users;
 ORDER BY created_at DESC;`;

    const { container } = render(
      <PrismCode
        code={code}
        language="sql" // Should auto-detect as diff-sql
      />,
    );

    // Wait for async highlight component to load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.className).toContain('diff-highlight');
  });

  test('renders with auto-detected language', () => {
    const code = `console.log('test');
+ console.log('added');
- console.log('removed');`;

    const { container } = render(
      <PrismCode code={code} language="javascript" />,
    );

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.className).toContain('diff-highlight');
  });

  test('PrismDiffCode renders with nested SQL highlighting', async () => {
    const original = `SELECT id, name FROM users;`;
    const modified = `SELECT id, name, email FROM users WHERE active = 1;`;

    const { container } = render(
      <PrismDiffCode original={original} modified={modified} language="sql" />,
    );

    // Wait for async highlight component to load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.className).toContain('diff-highlight');
  });

  test('renders HTML with tag and attribute tokens', () => {
    const code = `<button type="button" class="primary">Save</button>`;

    const { container } = render(<PrismCode code={code} language="html" />);

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.querySelector('.token.tag')).toBeInTheDocument();
    expect(codeElement?.querySelector('.token.attr-name')).toBeInTheDocument();
    // prism-react-renderer flattens nested markup with a parent `tag` type
    expect(
      codeElement?.querySelector('.token.tag.attr-name'),
    ).toBeInTheDocument();
    expect(
      codeElement?.querySelector('.token.tag.attr-value'),
    ).toBeInTheDocument();
    expect(
      codeElement?.querySelector('.token.tag.punctuation'),
    ).toBeInTheDocument();
  });

  test('highlights JavaScript inside HTML script tags', () => {
    const code = `<script>
  const x = 1;
  console.log('hi');
</script>`;

    const { container } = render(<PrismCode code={code} language="html" />);

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.querySelector('.token.keyword')).toBeInTheDocument();
    expect(codeElement?.querySelector('.token.string')).toBeInTheDocument();
  });

  test('sets the wrapped mod only when isWrapped is passed', () => {
    const code = 'a very long single-line error message';

    const { container: plain } = render(
      <PrismCode code={code} language="bash" />,
    );
    const { container: wrapped } = render(
      <PrismCode isWrapped code={code} language="bash" />,
    );

    expect(plain.querySelector('pre')).not.toHaveAttribute('data-wrapped');
    expect(wrapped.querySelector('pre')).toHaveAttribute('data-wrapped');
  });
});
