import apiClient from './apiClient';

export const profileApi = {
  getStudentProfile: () => apiClient.get('/api/v1/students/me'),
  updateStudentProfile: (data) => apiClient.put('/api/v1/students/me', data),
  
  getLecturerProfile: () => apiClient.get('/api/v1/lecturers/me'),
  updateLecturerProfile: (data) => apiClient.put('/api/v1/lecturers/me', data),

  getStaffProfile: () => apiClient.get('/api/v1/staff/me'),
  updateStaffProfile: (data) => apiClient.put('/api/v1/staff/me', data),

  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/accounts/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
