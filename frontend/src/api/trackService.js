import apiClient from './apiClient';

export const trackService = {
  getTracksByEvent: async (eventId) => {
    const response = await apiClient.get(`/api/v1/events/${eventId}/tracks`);
    return response.data;
  },

  createTrack: async (eventId, trackData) => {
    const response = await apiClient.post(`/api/v1/events/${eventId}/tracks`, trackData);
    return response.data;
  },

  updateTrack: async (id, trackData) => {
    const response = await apiClient.put(`/api/v1/tracks/${id}`, trackData);
    return response.data;
  },

  deleteTrack: async (id) => {
    const response = await apiClient.delete(`/api/v1/tracks/${id}`);
    return response.data;
  }
};
