import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Root } from '../components/Root';

export function renderWithRoot(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'queries' | 'wrapper'>,
) {
  return render(ui, { ...options, wrapper: Root });
}
