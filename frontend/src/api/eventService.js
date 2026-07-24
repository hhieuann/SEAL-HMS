import apiClient from './apiClient';

export const eventService = {
  getEvents: async () => {
    const response = await apiClient.get('/api/v1/events');
    return response.data;
  },

  getAssignedEvents: async () => {
    const response = await apiClient.get('/api/v1/events/assigned');
    return response.data;
  },

  getEventDetails: async (id) => {
    const response = await apiClient.get(`/api/v1/events/${id}`);
    const data = response.data;
    if (data?.data?.rounds) {
      data.data.rounds.sort((a, b) => (a.roundSeq || 0) - (b.roundSeq || 0));
      data.data.rounds.forEach(r => {
        if (r.startTime && r.durationHours && !r.end) {
          const start = new Date(r.startTime);
          start.setMinutes(start.getMinutes() + (r.durationHours * 60));
          r.end = start.toISOString();
        }
      });
    }
    return data;
  },

  getEventRounds: async (eventId) => {
    const response = await apiClient.get(`/api/v1/events/${eventId}/rounds`);
    const data = response.data;
    if (data?.data && Array.isArray(data.data)) {
      data.data.sort((a, b) => (a.roundSeq || 0) - (b.roundSeq || 0));
      data.data.forEach(r => {
        if (r.startTime && r.durationHours && !r.end) {
          const start = new Date(r.startTime);
          start.setMinutes(start.getMinutes() + (r.durationHours * 60));
          r.end = start.toISOString();
        }
      });
    }
    return data;
  },

  createEventBatch: async (eventData) => {
    const response = await apiClient.post('/api/v1/events', eventData);
    return response.data;
  },

  cancelEvent: async (id) => {
    const response = await apiClient.post(`/api/v1/events/${id}/cancel`);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await apiClient.delete(`/api/v1/events/${id}`);
    return response.data;
  },

  updateEventStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/v1/events/${id}/status`, { status });
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await apiClient.put(`/api/v1/events/${id}`, eventData);
    return response.data;
  },

  resetEventData: async (id) => {
    const response = await apiClient.delete(`/api/v1/events/${id}/reset-data`);
    return response.data;
  },

  updateRound: async (id, roundData) => {
    const response = await apiClient.put(`/api/v1/rounds/${id}`, roundData);
    return response.data;
  },

  updateRoundStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/v1/rounds/${id}/status`, { status });
    return response.data;
  },

  createRound: async (eventId, roundData) => {
    const response = await apiClient.post(`/api/v1/events/${eventId}/rounds`, roundData);
    return response.data;
  },

  deleteRound: async (id) => {
    const response = await apiClient.delete(`/api/v1/rounds/${id}`);
    return response.data;
  },

  getAssignedStaff: async (eventId) => {
    const response = await apiClient.get(`/api/v1/events/${eventId}/staff`);
    return response.data;
  },

  assignStaff: async (eventId, accountId) => {
    const response = await apiClient.post(`/api/v1/events/${eventId}/staff`, { accountId });
    return response.data;
  },

  removeStaff: async (eventId, accountId) => {
    const response = await apiClient.delete(`/api/v1/events/${eventId}/staff/${accountId}`);
    return response.data;
  }
};
