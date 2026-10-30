import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '@/store/settings';
import { PaletteHost } from './PaletteHost';
import { usePalette } from './paletteStore';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const setup = () =>
  render(
    <MemoryRouter>
      <Where />
      <PaletteHost />
    </MemoryRouter>,
  );

beforeEach(() => {
  usePalette.setState({ open: false });
  useSettings.setState({ tone: 'hype', soundOn: false });
});

const typeAndEnter = async (text: string) => {
  const input = await screen.findByRole('combobox');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

const openPalette = () => act(() => usePalette.setState({ open: true }));

describe('command palette', () => {
  it('opens with Ctrl+K and closes with Escape', async () => {
    setup();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(await screen.findByRole('dialog', { name: /command palette/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('navigates with the keyboard', async () => {
    setup();
    openPalette();
    await typeAndEnter('daily');
    expect(screen.getByTestId('where')).toHaveTextContent('/daily');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('changes tone and sound settings', async () => {
    setup();
    openPalette();
    await typeAndEnter('tone roast');
    expect(useSettings.getState().tone).toBe('roast');
    openPalette();
    await typeAndEnter('sound');
    expect(useSettings.getState().soundOn).toBe(true);
  });

  it('shows a friendly empty state', async () => {
    setup();
    openPalette();
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'zzzzqqq' } });
    expect(screen.getByText(/nothing matches/i)).toBeInTheDocument();
  });
});
