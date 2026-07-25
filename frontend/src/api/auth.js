import apiClient from './apiClient';

const AUTH_KEYS = [
  'token', 'role', 'userRole', 'accountId', 'userId', 'currentUser',
  'userEmail', 'userName', 'avatarUrl',
];

const PARTICIPANT_KEYS = [
  'p_eventId', 'p_selectedEventId', 'p_hasJoinedEvent', 'p_hasTeam',
  'p_teamInviteCode', 'myTeamName', 'p_teamId', 'p_isLeader',
  'currentEventId',
];

export const clearAuthSession = () => {
  AUTH_KEYS.forEach(key => localStorage.removeItem(key));
  PARTICIPANT_KEYS.forEach(key => localStorage.removeItem(key));
};

export const authApi = {
  login: async (email, password) => {
    // Clear old state before login to prevent cross-account bleeding
    clearAuthSession();
    
    const response = await apiClient.post('/api/v1/auth/login', { email, password });
    const { token, role, accountId, email: returnedEmail, name: returnedName, avatarUrl } = response.data.data;
    let resolvedAccountId = accountId;
    
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
          resolvedAccountId = matched.id;
          localStorage.setItem('accountId', matched.id);
          localStorage.setItem('userId', matched.id);
        }
      } catch {
        // If accounts endpoint is not accessible (e.g. participant role), try PENDING too
        try {
          const accountsRes = await apiClient.get('/api/v1/accounts?status=PENDING');
          const accounts = accountsRes.data?.data || [];
          const matched = accounts.find(a => a.email === (returnedEmail || email));
          if (matched) {
            resolvedAccountId = matched.id;
            localStorage.setItem('accountId', matched.id);
            localStorage.setItem('userId', matched.id);
          }
        } catch {
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
            resolvedAccountId = resolvedId;
            localStorage.setItem('accountId', resolvedId);
            localStorage.setItem('userId', resolvedId);
          } else {
            console.warn('Could not resolve accountId — BE login response missing accountId field.');
          }
        }
      }
    }
    
    return { token, role, accountId: resolvedAccountId, name: returnedName, avatarUrl };
  },

  register: async (email, password, role = 'STUDENT', studentCode, firstName, lastName, campus, proofFile) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    if (studentCode) formData.append('studentCode', studentCode);
    if (firstName) formData.append('firstName', firstName);
    if (lastName) formData.append('lastName', lastName);
    if (campus) formData.append('campus', campus);
    if (proofFile) formData.append('proofFile', proofFile);
    
    const response = await apiClient.post('/api/v1/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    // The register API returns the ID (unlike the login API). Store it immediately so new accounts work!
    const data = response.data?.data || {};
    if (data.id) {
      localStorage.setItem('accountId', data.id);
      localStorage.setItem('userId', data.id);
    }
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await apiClient.put('/api/v1/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },

  logout: () => {
    clearAuthSession();
    window.location.href = '/login';
  }
};
