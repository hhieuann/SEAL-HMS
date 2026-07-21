import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmModal isOpen={false} title="T" message="M" onConfirm={() => {}} onClose={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows title and message when open', () => {
    render(
      <ConfirmModal isOpen title="Delete event?" message="This cannot be undone." onConfirm={() => {}} onClose={() => {}} />
    );
    expect(screen.getByText('Delete event?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('calls onConfirm then onClose when confirm is clicked', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmModal isOpen title="T" message="M" confirmText="Yes, delete" onConfirm={onConfirm} onClose={onClose} />
    );
    await userEvent.click(screen.getByText('Yes, delete'));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cancel triggers only onClose, never onConfirm', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmModal isOpen title="T" message="M" cancelText="Cancel" onConfirm={onConfirm} onClose={onClose} />
    );
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables confirm until the required phrase is typed', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal isOpen title="T" message="M" confirmText="Confirm" requireInput="RESET"
        onConfirm={onConfirm} onClose={() => {}} />
    );
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox'), 'RESET');
    expect(confirmBtn).toBeEnabled();
    await userEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('renders a single OK button when no onConfirm is given', () => {
    render(<ConfirmModal isOpen title="Info" message="FYI" onClose={() => {}} />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
