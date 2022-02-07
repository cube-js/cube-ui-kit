/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/extend-expect';
// import { expect } from '@open-wc/testing';

//👇 Imports a specific story for the test
import { Primary } from './Button.stories';

it('renders the button in the primary state', () => {
  // render(ReactDOM.render(createElement(Primary, Primary.args), document.body));
  // @ts-ignore
  render(<Primary {...Primary.args} />);
  expect(screen.getByRole('button')).toHaveTextContent('Button');
});
