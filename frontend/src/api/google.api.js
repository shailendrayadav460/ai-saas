import api from './axios';

export const googleAPI = {
  getStatus: () => api.get('/google/status'),
  disconnect: () => api.delete('/google/disconnect'),
  connectUrl: () => `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`,

  // Gmail
  sendEmail: (data) => api.post('/google/gmail/send', data),

  // Calendar
  listEvents: (params) => api.get('/google/calendar/events', { params }),
  createEvent: (data) => api.post('/google/calendar/events', data),
  createMeet: (data) => api.post('/google/calendar/meet', data),

  // Drive
  listFiles: (params) => api.get('/google/drive/files', { params }),
  uploadFile: (data) => api.post('/google/drive/upload', data),

  // Sheets
  createSheet: (data) => api.post('/google/sheets/create', data),
  appendRows: (id, data) => api.post(`/google/sheets/${id}/append`, data),

  // Docs
  createDoc: (data) => api.post('/google/docs/create', data),
};
