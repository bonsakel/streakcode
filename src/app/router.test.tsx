import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './router';

function renderAt(path: string) {
  window.scrollTo = vi.fn();
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe('routing shell', () => {
  it.each([
    ['/', /build your streak/i],
    ['/problems', /problems/i],
    ['/problem/rizz-calculator', /rizz calculator/i],
    ['/problem/not-a-real-one', /no problem called/i],
    ['/daily', /daily challenge/i],
    ['/boss', /boss fight/i],
    ['/profile', /profile/i],
    ['/about', /about streakcode/i],
    ['/nope', /404/i],
  ])('renders %s', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('exposes navigation landmarks and a skip link', async () => {
    renderAt('/');
    expect(await screen.findByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main');
  });
});
