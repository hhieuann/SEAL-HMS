import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SystemHealthPanel from './SystemHealthPanel';

const mocks = vi.hoisted(() => ({
  getSystemHealth: vi.fn(),
}));

vi.mock('../../api/adminApi', () => ({
  adminApi: { getSystemHealth: mocks.getSystemHealth },
}));

const GB = 1024 * 1024 * 1024;

/** What adminApi.getSystemHealth returns for an ADMIN when everything is fine. */
const healthy = {
  reachable: true,
  latencyMs: 12,
  status: 'UP',
  components: {
    db: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
    diskSpace: { status: 'UP', details: { total: 931 * GB, free: 412 * GB, threshold: 10485760 } },
    schema: { status: 'UP', details: { version: 'V38', description: 'split raw score from adjustments' } },
  },
};

const rowValue = (label) => screen.getByText(label).nextElementSibling;

describe('SystemHealthPanel', () => {
  beforeEach(() => {
    mocks.getSystemHealth.mockReset();
  });

  it('shows every component as the backend reported it', async () => {
    mocks.getSystemHealth.mockResolvedValue(healthy);
    render(<SystemHealthPanel />);

    expect(await screen.findByText('Up · 12 ms')).toBeInTheDocument();
    expect(rowValue('Database')).toHaveTextContent('Up · PostgreSQL');
    expect(rowValue('Disk space')).toHaveTextContent('412 GB free of 931 GB');
    expect(rowValue('Schema')).toHaveTextContent('V38');
    expect(screen.getByText(/Checked at/)).toBeInTheDocument();
  });

  it('marks the database down and keeps the API up when only the database failed', async () => {
    mocks.getSystemHealth.mockResolvedValue({
      ...healthy,
      status: 'DOWN',
      components: {
        ...healthy.components,
        db: { status: 'DOWN', details: { error: 'PSQLException: connection refused' } },
      },
    });
    render(<SystemHealthPanel />);

    expect(await screen.findByText('Up · 12 ms')).toBeInTheDocument();
    expect(rowValue('Database')).toHaveTextContent('Down');
    expect(rowValue('Database')).toHaveAttribute('title', 'PSQLException: connection refused');
    expect(rowValue('Schema')).toHaveTextContent('V38');
  });

  it('reports the API unreachable, with nothing else claimed, when the backend is off', async () => {
    mocks.getSystemHealth.mockResolvedValue({ reachable: false, latencyMs: null, status: 'DOWN', components: {} });
    render(<SystemHealthPanel />);

    expect(await screen.findByText('Unreachable')).toBeInTheDocument();
    expect(rowValue('Database')).toHaveTextContent('Not reported');
    expect(rowValue('Disk space')).toHaveTextContent('Not reported');
    expect(rowValue('Schema')).toHaveTextContent('Not reported');
    expect(screen.queryByText(/Operational/)).not.toBeInTheDocument();
  });

  it('checks again when asked', async () => {
    mocks.getSystemHealth
      .mockResolvedValueOnce({ reachable: false, latencyMs: null, status: 'DOWN', components: {} })
      .mockResolvedValueOnce(healthy);
    render(<SystemHealthPanel />);

    expect(await screen.findByText('Unreachable')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Refresh/ }));

    expect(await screen.findByText('Up · 12 ms')).toBeInTheDocument();
    expect(mocks.getSystemHealth).toHaveBeenCalledTimes(2);
  });
});
