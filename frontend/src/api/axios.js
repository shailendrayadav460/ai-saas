import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true, // Send cookies
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — unwrap data.data
api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error) => {
    const message = error.response?.data?.message || 'Something went wrong';

    // Auto-redirect to login on 401
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isLoginPage) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
