import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from './apiClient';
import { authApi, clearAuthSession } from './auth';

vi.mock('./apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('auth session management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('clears authentication and participant state together', () => {
    localStorage.setItem('token', 'old-token');
    localStorage.setItem('userRole', 'ADMIN');
    localStorage.setItem('userId', '1');
    localStorage.setItem('p_eventId', '10');
    localStorage.setItem('p_teamId', '20');

    clearAuthSession();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userRole')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('p_eventId')).toBeNull();
    expect(localStorage.getItem('p_teamId')).toBeNull();
  });

  it('does not retain the previous account when a new login fails', async () => {
    localStorage.setItem('token', 'old-token');
    localStorage.setItem('userRole', 'ADMIN');
    apiClient.post.mockRejectedValueOnce(new Error('Invalid credentials'));

    await expect(authApi.login('student@seal-hms.local', 'wrong')).rejects.toThrow('Invalid credentials');

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userRole')).toBeNull();
  });

  it('stores and returns the identity supplied by the backend', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          token: 'new-token',
          role: 'STUDENT',
          accountId: 4,
          email: 'student@seal-hms.local',
          name: 'Demo Student',
          avatarUrl: '/uploads/avatar.png',
        },
      },
    });

    const result = await authApi.login('student@seal-hms.local', 'Student@12345');

    expect(result).toEqual({
      token: 'new-token',
      role: 'STUDENT',
      accountId: 4,
      name: 'Demo Student',
      avatarUrl: '/uploads/avatar.png',
    });
    expect(localStorage.getItem('userRole')).toBe('STUDENT');
    expect(localStorage.getItem('userId')).toBe('4');
  });
});
