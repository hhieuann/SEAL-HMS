import apiClient from './apiClient';

export const teamService = {
  getTeamsByEvent: async (eventId) => {
    const response = await apiClient.get(`/api/v1/events/${eventId}/teams`);
    return response.data;
  },

  getTeamDetails: async (teamId) => {
    const response = await apiClient.get(`/api/v1/teams/${teamId}`);
    return response.data;
  },

  createTeam: async (eventId, teamData) => {
    const response = await apiClient.post(`/api/v1/events/${eventId}/teams`, teamData);
    return response.data;
  },

  updateTeamStatus: async (teamId, status) => {
    const response = await apiClient.patch(`/api/v1/teams/${teamId}/status`, { status });
    return response.data;
  },

  randomAssign: async (teamId, eventId) => {
    const response = await apiClient.post(`/api/v1/teams/${teamId}/random-assign?eventId=${eventId}`);
    return response.data;
  },

  assignTrack: async (teamId, trackId) => {
    const response = await apiClient.patch(`/api/v1/teams/${teamId}/assign-track?trackId=${trackId}`);
    return response.data;
  },

  getMembers: async (teamId) => {
    const response = await apiClient.get(`/api/v1/teams/${teamId}/members`);
    return response.data;
  },

  inviteMember: async (teamId, memberData) => {
    const response = await apiClient.post(`/api/v1/teams/${teamId}/members`, memberData);
    return response.data;
  },

  acceptInvite: async (teamId, accountId) => {
    const response = await apiClient.patch(`/api/v1/teams/${teamId}/members/${accountId}/accept`);
    return response.data;
  }
};
