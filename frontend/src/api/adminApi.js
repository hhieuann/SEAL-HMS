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
      joined: acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('en-GB') : 'N/A'
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
      studentCode: acc.studentCode || null,
      campus: acc.campus || null,
      department: acc.department || null,
      phone: acc.phone || null,
      proofUrl: acc.proof || null,
      joined: acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('en-GB') : 'N/A'
    }));
  },

  updateAccountStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/v1/accounts/${id}/status`, { status });
    return response.data.data;
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

  /**
   * Judges who still have scoring to finish before this round can close. The backend leaves out
   * tracks no team advanced into — those judges have nothing to score and must not block.
   */
  getPendingJudges: async (roundId) => {
    const response = await apiClient.get(`/api/v1/rounds/${roundId}/pending-judges`);
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
  },

  // ── Chapters (year-long Chapter Leaderboard) ──────────────────────────────
  getChapters: async () => {
    const response = await apiClient.get('/api/v1/chapters');
    return response.data.data || [];
  },

  getChapterLeaderboard: async () => {
    const response = await apiClient.get('/api/v1/chapters/leaderboard');
    return response.data.data || [];
  },

  createChapter: async ({ name, bonusPoint }) => {
    const response = await apiClient.post('/api/v1/chapters', { name, bonusPoint });
    return response.data.data;
  },

  updateChapter: async (id, { name, bonusPoint }) => {
    const response = await apiClient.put(`/api/v1/chapters/${id}`, { name, bonusPoint });
    return response.data.data;
  },

  deleteChapter: async (id) => {
    const response = await apiClient.delete(`/api/v1/chapters/${id}`);
    return response.data;
  }
};

