import apiClient from './apiClient';

const PARTICIPANT_KEYS = ['p_hasJoinedEvent', 'p_hasTeam', 'p_teamInviteCode', 'myTeamName', 'p_teamId', 'p_isLeader'];

export const authApi = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('http://localhost:8080/api/v1/auth/login', { email, password });
      const { token, role, accountId, email: returnedEmail } = response.data.data; // ApiResponse format
      
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userEmail', returnedEmail || email);
      
      // Real backend now returns the accountId
      if (accountId) {
          localStorage.setItem('accountId', accountId);
          localStorage.setItem('userId', accountId); // Fallback for old code
      } else {
          localStorage.setItem('accountId', role === 'ADMIN' ? '2' : '1');
      }
      
      return { token, role, accountId };
    } catch (err) {
      throw err;
    }
  },

  register: async (email, password, role = 'STUDENT') => {
    try {
      const response = await apiClient.post('http://localhost:8080/api/v1/auth/register', { email, password, role });
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('accountId');
    localStorage.removeItem('currentUser');
    
    PARTICIPANT_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    
    window.location.href = '/login';
  }
};
