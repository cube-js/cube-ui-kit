import { render } from '@testing-library/react';
import App from './App';

describe('<App>', () => {
  it.skip('renders learn react link', () => {
    const { getByText } = render(<App />);
    const linkElement = getByText(/learn react/i);
    expect(document.body.contains(linkElement));
  });
});
