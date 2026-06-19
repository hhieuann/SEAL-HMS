import apiClient from './apiClient';

export const adminApi = {
  getPendingAccounts: async () => {
    const response = await apiClient.get('/api/v1/accounts?status=PENDING');
    return response.data.data.map(acc => ({
      id: acc.id,
      name: 'N/A (Update later)',
      email: acc.email,
      studentId: 'N/A',
      campus: 'N/A',
      proof: 'Verification Proof',
      registered: 'Just now'
    }));
  },

  getActiveAccounts: async () => {
    const response = await apiClient.get('/api/v1/accounts?status=ACTIVE');
    return response.data.data.map(acc => ({
      id: acc.id,
      name: 'N/A (Update later)',
      email: acc.email,
      role: acc.role,
      status: acc.status.toLowerCase(),
      joined: 'Just now'
    }));
  },

  approveAccount: async (accountId) => {
    const response = await apiClient.patch(`/api/v1/accounts/${accountId}/approve`);
    return response.data;
  },

  rejectAccount: async (accountId) => {
    const response = await apiClient.patch(`/api/v1/accounts/${accountId}/status`, { status: 'DISABLED' });
    return response.data;
  }
};
