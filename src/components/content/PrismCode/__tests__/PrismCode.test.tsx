import { render } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';

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
});
