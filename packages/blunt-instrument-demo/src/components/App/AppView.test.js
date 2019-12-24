import React from 'react';
import { render } from '@testing-library/react';
import AppView from './AppView';

test('renders link to author', () => {
  const { getByText } = render(<AppView />);
  const linkElement = getByText(/brokensandals/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders link to github', () => {
  const { getByText } = render(<AppView />);
  const linkElement = getByText(/github/i);
  expect(linkElement).toBeInTheDocument();
});
