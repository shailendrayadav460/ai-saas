import api from './axios';

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (title) => api.post('/chat/conversations', { title }),
  getMessages: (id) => api.get(`/chat/conversations/${id}/messages`),
  sendMessage: (id, content) => api.post(`/chat/conversations/${id}/messages`, { content }),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
  updateTitle: (id, title) => api.patch(`/chat/conversations/${id}`, { title }),
};
