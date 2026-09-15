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

describe('adminApi.getSystemHealth', () => {
  beforeEach(() => vi.clearAllMocks());

  const report = { status: 'UP', components: { db: { status: 'UP' } } };

  it('returns the report with the measured latency', async () => {
    apiClient.get.mockResolvedValue({ data: report });

    const health = await adminApi.getSystemHealth();

    expect(apiClient.get).toHaveBeenCalledWith('/actuator/health');
    expect(health).toMatchObject({ reachable: true, status: 'UP', components: report.components });
    expect(typeof health.latencyMs).toBe('number');
  });

  it('keeps a 503 DOWN answer as a report instead of an error', async () => {
    const down = { status: 'DOWN', components: { db: { status: 'DOWN', details: { error: 'refused' } } } };
    apiClient.get.mockRejectedValue({ response: { status: 503, data: down } });

    const health = await adminApi.getSystemHealth();

    expect(health).toMatchObject({ reachable: true, status: 'DOWN', components: down.components });
  });

  it('is unreachable when the request never got an answer', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'));

    expect(await adminApi.getSystemHealth()).toEqual({ reachable: false, latencyMs: null, status: 'DOWN', components: {} });
  });

  it('is unreachable when something other than the backend answered', async () => {
    // The dev server returns index.html for any path it does not proxy.
    apiClient.get.mockResolvedValue({ data: '<!doctype html><html></html>' });

    expect((await adminApi.getSystemHealth()).reachable).toBe(false);
  });
});
