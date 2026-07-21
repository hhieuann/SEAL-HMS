import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the axios client so we test the mapping logic, not the network.
vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

import apiClient from './apiClient';
import { adminApi } from './adminApi';

describe('adminApi.getActiveAccounts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps profile fields used by the View Profile modal', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 7, email: 'lect@fpt.edu.vn', role: 'LECTURER', status: 'ACTIVE',
            fullName: 'Le Van A', department: 'SE', campus: 'HCM', phone: '0900000000',
            studentCode: null, proof: null, avatarUrl: '/uploads/a.png',
          },
        ],
      },
    });

    const [acc] = await adminApi.getActiveAccounts();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/accounts?status=ACTIVE');
    expect(acc).toMatchObject({
      id: 7,
      name: 'Le Van A',
      email: 'lect@fpt.edu.vn',
      role: 'LECTURER',
      status: 'active',       // lower-cased for the UI badge
      department: 'SE',
      campus: 'HCM',
      phone: '0900000000',
    });
  });

  it('falls back to a placeholder name when fullName is missing', async () => {
    apiClient.get.mockResolvedValue({
      data: { data: [{ id: 1, email: 'x@y.z', role: 'STAFF', status: 'ACTIVE' }] },
    });

    const [acc] = await adminApi.getActiveAccounts();

    expect(acc.name).toBe('N/A (Update later)');
  });
});

describe('adminApi.updateAccountStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('PATCHes the status endpoint with the new status', async () => {
    apiClient.patch.mockResolvedValue({ data: { data: { id: 7, status: 'DISABLED' } } });

    await adminApi.updateAccountStatus(7, 'DISABLED');

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/accounts/7/status', { status: 'DISABLED' });
  });
});
