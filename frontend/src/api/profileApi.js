import apiClient from './apiClient';

export const profileApi = {
  getStudentProfile: () => apiClient.get('/api/v1/students/me'),
  updateStudentProfile: (data) => apiClient.put('/api/v1/students/me', data),
  
  getLecturerProfile: () => apiClient.get('/api/v1/lecturers/me'),
  updateLecturerProfile: (data) => apiClient.put('/api/v1/lecturers/me', data),
};
