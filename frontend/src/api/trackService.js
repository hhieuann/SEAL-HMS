import apiClient from './apiClient';

export const trackService = {
  getTracksByEvent: async (eventId) => {
    const response = await apiClient.get(`/api/v1/events/${eventId}/tracks`);
    return response.data;
  },

  getTrackAssignments: async (trackId) => {
    const response = await apiClient.get(`/api/v1/tracks/${trackId}/assignments`);
    return response.data;
  },

  createTrack: async (eventId, trackData) => {
    const response = await apiClient.post(`/api/v1/events/${eventId}/tracks`, trackData);
    return response.data;
  },

  getTopicsByTrack: async (trackId) => {
    const response = await apiClient.get(`/api/v1/tracks/${trackId}/topics`);
    return response.data;
  },

  createTopic: async (trackId, topicData) => {
    const response = await apiClient.post(`/api/v1/tracks/${trackId}/topics`, topicData);
    return response.data;
  },

  getTopicsByEvent: async (eventId) => {
    const response = await apiClient.get(`/api/v1/events/${eventId}/topics`);
    return response.data;
  },

  createTopicByEvent: async (eventId, topicData) => {
    const response = await apiClient.post(`/api/v1/events/${eventId}/topics`, topicData);
    return response.data;
  },

  assignTopicToTrack: async (topicId, trackId) => {
    const response = await apiClient.patch(`/api/v1/topics/${topicId}/assign-track?trackId=${trackId}`);
    return response.data;
  },

  updateTopic: async (id, topicData) => {
    const response = await apiClient.put(`/api/v1/topics/${id}`, topicData);
    return response.data;
  },

  deleteTopic: async (id) => {
    const response = await apiClient.delete(`/api/v1/topics/${id}`);
    return response.data;
  },

  updateTrack: async (id, trackData) => {
    const response = await apiClient.put(`/api/v1/tracks/${id}`, trackData);
    return response.data;
  },

  deleteTrack: async (id) => {
    const response = await apiClient.delete(`/api/v1/tracks/${id}`);
    return response.data;
  },

  completeScoring: async (trackId) => {
    const response = await apiClient.post(`/api/v1/tracks/${trackId}/complete-scoring`);
    return response.data;
  },

  getEventAssignments: async (eventId) => {
    const response = await apiClient.get(`/api/v1/events/${eventId}/assignments`);
    return response.data?.data || [];
  },

  getMyAssignments: async () => {
    const response = await apiClient.get(`/api/v1/users/me/assignments`);
    return response.data?.data || [];
  }
};
