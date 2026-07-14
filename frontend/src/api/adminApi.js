import apiClient from './apiClient';

export const adminApi = {
  getPendingAccounts: async () => {
    const response = await apiClient.get('/api/v1/accounts?status=PENDING');
    return response.data.data.map(acc => ({
      id: acc.id,
      name: acc.fullName || 'N/A (Update later)',
      email: acc.email,
      studentId: acc.studentCode || 'N/A',
      campus: acc.campus || 'N/A',
      role: acc.role,
      avatarUrl: acc.avatarUrl,
      proof: 'Student ID', 
      proofUrl: acc.proof || null,
      registered: 'Just now'
    }));
  },

  getActiveAccounts: async () => {
    const response = await apiClient.get('/api/v1/accounts?status=ACTIVE');
    return response.data.data.map(acc => ({
      id: acc.id,
      name: acc.fullName || 'N/A (Update later)',
      email: acc.email,
      role: acc.role,
      avatarUrl: acc.avatarUrl,
      status: acc.status.toLowerCase(),
      joined: 'Just now'
    }));
  },

  approveAccount: async (accountId) => {
    const response = await apiClient.patch(`/api/v1/accounts/${accountId}/approve`);
    return response.data;
  },

  rejectAccount: async (accountId) => {
    const response = await apiClient.delete(`/api/v1/accounts/${accountId}`);
    return response.data;
  },

  // --- Lecturer Management ---

  createLecturerAccount: async ({ email, fullName, department, campus, phone }) => {
    const response = await apiClient.post('/api/v1/lecturers/admin-create', {
      email, fullName, department, campus, phone
    });
    return response.data.data; // { accountId, email, fullName, tempPassword }
  },

  createStaffAccount: async ({ email, fullName, department, phone, campus }) => {
    const response = await apiClient.post('/api/v1/staff/admin-create', {
      email, fullName, department, phone, campus
    });
    return response.data.data; // { accountId, email, fullName, tempPassword }
  },

  getLecturers: async () => {
    const response = await apiClient.get('/api/v1/lecturers');
    return response.data.data || []; // [{ id, accountId, email, fullName, department, campus, phone }]
  },

  // --- Track Assignments ---

  getEventAssignments: async (eventId) => {
    const response = await apiClient.get(`/api/v1/events/${eventId}/assignments`);
    return response.data.data || [];
  },

  assignLecturerToTrack: async (trackId, lecturerId, role) => {
    const response = await apiClient.post(`/api/v1/tracks/${trackId}/assignments`, {
      lecturerId, role
    });
    return response.data.data;
  },

  removeAssignment: async (assignmentId) => {
    const response = await apiClient.delete(`/api/v1/track-assignments/${assignmentId}`);
    return response.data;
  }
};

