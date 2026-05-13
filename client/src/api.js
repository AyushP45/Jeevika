import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('jeevika_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jeevika_token');
      localStorage.removeItem('jeevika_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

export const jobsAPI = {
  getAll: (params) => API.get('/jobs', { params }),
  getOne: (id) => API.get(`/jobs/${id}`),
  create: (data) => API.post('/jobs', data),
  apply: (id) => API.post(`/jobs/${id}/apply`),
  updateApplicant: (jobId, appId, data) => API.put(`/jobs/${jobId}/applicants/${appId}`, data),
  complete: (id) => API.put(`/jobs/${id}/complete`),
  boost: (id) => API.put(`/jobs/${id}/boost`),
  getMyJobs: () => API.get('/jobs/employer/my-jobs'),
};

export const walletAPI = {
  getBalance: () => API.get('/wallet/balance'),
  getTransactions: () => API.get('/wallet/transactions'),
  deposit: (amount) => API.post('/wallet/deposit', { amount }),
  withdraw: (amount) => API.post('/wallet/withdraw', { amount }),
};

export const workersAPI = {
  getAll: (params) => API.get('/workers', { params }),
  review: (id, data) => API.post(`/workers/${id}/review`, data),
};

export const adminAPI = {
  getUsers: () => API.get('/admin/users'),
  verifyWorker: (id) => API.put(`/admin/verify/${id}`),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getJobs: () => API.get('/admin/jobs'),
  deleteJob: (id) => API.delete(`/admin/jobs/${id}`),
  getReports: () => API.get('/admin/reports'),
  updateReport: (id, data) => API.put(`/admin/reports/${id}`, data),
  getAnalytics: () => API.get('/admin/analytics'),
};

export default API;
