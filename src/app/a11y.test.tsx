import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './router';

// jsdom cannot compute colors, so contrast is checked in a real browser instead (see DECISIONS.md).
async function violationsAt(path: string, heading: RegExp) {
  window.scrollTo = vi.fn();
  const { container } = render(
    <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />,
  );
  await screen.findByRole('heading', { level: 1, name: heading });
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`);
}

describe('accessibility (axe)', () => {
  it.each([
    ['/', /build your streak/i],
    ['/problems', /problems/i],
    ['/daily', /daily challenge/i],
    ['/boss', /boss fight/i],
    ['/profile', /profile/i],
    ['/about', /about streakcode/i],
    ['/nope', /404/i],
  ])('%s has no axe violations', async (path, heading) => {
    expect(await violationsAt(path, heading)).toEqual([]);
  });
});
