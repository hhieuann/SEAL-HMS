import apiClient from './apiClient';

const PARTICIPANT_KEYS = ['p_hasJoinedEvent', 'p_hasTeam', 'p_teamInviteCode', 'myTeamName', 'p_teamId', 'p_isLeader'];

export const authApi = {
  login: async (email, password) => {
    try {
      // Clear old state before login to prevent cross-account bleeding
      localStorage.removeItem('currentUser');
      PARTICIPANT_KEYS.forEach(key => localStorage.removeItem(key));
      
      const response = await apiClient.post('/api/v1/auth/login', { email, password });
      const { token, role, accountId, email: returnedEmail, name: returnedName, avatarUrl } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userEmail', returnedEmail || email);
      if (returnedName) localStorage.setItem('userName', returnedName);
      if (avatarUrl) {
        localStorage.setItem('avatarUrl', avatarUrl);
      }
      
      if (accountId) {
        localStorage.setItem('accountId', accountId);
        localStorage.setItem('userId', accountId);
      } else {
        // Workaround: BE does not return accountId in login response.
        // Fetch accounts list and match by email to resolve the real accountId.
        try {
          const accountsRes = await apiClient.get('/api/v1/accounts?status=ACTIVE');
          const accounts = accountsRes.data?.data || [];
          const matched = accounts.find(a => a.email === (returnedEmail || email));
          if (matched) {
            localStorage.setItem('accountId', matched.id);
            localStorage.setItem('userId', matched.id);
          }
        } catch (e) {
          // If accounts endpoint is not accessible (e.g. participant role), try PENDING too
          try {
            const accountsRes = await apiClient.get('/api/v1/accounts?status=PENDING');
            const accounts = accountsRes.data?.data || [];
            const matched = accounts.find(a => a.email === (returnedEmail || email));
            if (matched) {
              localStorage.setItem('accountId', matched.id);
              localStorage.setItem('userId', matched.id);
            }
          } catch (e2) {
            // TEMPORARY: hardcoded email→id map for local testing only.
            // DELETE THIS when BE includes accountId in the login response.
            const knownAccounts = {
              'admin@seal-hms.local': 1,
              'staff@seal-hms.local': 2,
              'test@test.com': 3,
              'steve23121993@gmail.com': 4,
              'test1@gmail.com': 5,
              'test2@gmail.com': 6,
            };
            const resolvedId = knownAccounts[returnedEmail || email];
            if (resolvedId) {
              localStorage.setItem('accountId', resolvedId);
              localStorage.setItem('userId', resolvedId);
            } else {
              console.warn('Could not resolve accountId — BE login response missing accountId field.');
            }
          }
        }
      }
      
      return { token, role, accountId };
    } catch (err) {
      throw err;
    }
  },

  register: async (email, password, role = 'STUDENT', studentCode, firstName, lastName, campus, proofFile) => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      if (studentCode) formData.append('studentCode', studentCode);
      if (firstName) formData.append('firstName', firstName);
      if (lastName) formData.append('lastName', lastName);
      if (campus) formData.append('campus', campus);
      if (proofFile) formData.append('proofFile', proofFile);
      
      const response = await apiClient.post('/api/v1/auth/register', formData);
      // The register API returns the ID (unlike the login API). Store it immediately so new accounts work!
      const data = response.data?.data || {};
      if (data.id) {
        localStorage.setItem('accountId', data.id);
        localStorage.setItem('userId', data.id);
      }
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiClient.put('/api/v1/auth/change-password', { oldPassword, newPassword });
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
