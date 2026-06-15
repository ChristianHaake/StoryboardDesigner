import { render } from '@testing-library/react';
import { it, expect } from 'vitest';
import App from './App';
import '../test/setup-i18n';

it('renders App without crashing', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
