import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Tabs } from './Tabs';
import { Modal } from './Modal';

describe('Button', () => {
  it('defaults to type=button and fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Run</Button>);
    const btn = screen.getByRole('button', { name: 'Run' });
    expect(btn).toHaveAttribute('type', 'button');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('Tabs', () => {
  it('supports arrow-key navigation and skips disabled tabs', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        label="Sections"
        value="a"
        onChange={onChange}
        items={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B', disabled: true },
          { id: 'c', label: 'C' },
        ]}
      />,
    );
    fireEvent.keyDown(screen.getByRole('tab', { name: 'A' }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('c');
  });
});

describe('Modal', () => {
  it('closes on Escape and renders nothing when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open onClose={onClose} title="Hello">
        <button>ok</button>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Hello' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    rerender(
      <Modal open={false} onClose={onClose} title="Hello">
        <button>ok</button>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
