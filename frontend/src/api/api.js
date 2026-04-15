import axios from 'axios';

// 1. Axios Instance එක හදන්න
const api = axios.create({
  baseURL: 'http://localhost:8081/api',
});

// 2. Request Interceptor එක
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────
export const getMe = () => api.get('/users/me');
export const updateMyProfile = (data) => api.put('/users/me', data);

// ─── Notifications ─────────────────────────────────
export const getNotifications    = ()    => api.get('/notifications');
export const getUnreadCount      = ()    => api.get('/notifications/count');
export const markAsRead          = (id)  => api.patch(`/notifications/${id}/read`);
export const markAllAsRead       = ()    => api.patch('/notifications/read-all');
export const deleteNotification  = (id)  => api.delete(`/notifications/${id}`);

// ─── Users / Admin ─────────────────────────────────
export const getAllUsers         = ()            => api.get('/users');
export const updateUserRole      = (id, role)    => api.put(`/users/${id}/roles`, { roles: [role] });
export const createAdminUser     = (data)        => api.post('/admin/create', data);

// ─── Resources ─────────────────────────────────────
export const getResources         = (params) => api.get('/resources', { params });
export const getResourceById      = (id)     => api.get(`/resources/${id}`);
export const getResourceTypes     = ()       => api.get('/resources/types');
export const createResource       = (data)   => api.post('/resources', data);
export const updateResource       = (id, data) => api.put(`/resources/${id}`, data);
export const toggleResourceStatus = (id)     => api.patch(`/resources/${id}/status`);
export const deleteResource       = (id)     => api.delete(`/resources/${id}`);

// ─── Bookings ──────────────────────────────────────
export const getMyBookings       = (params)              => api.get('/bookings/my', { params });
export const getAllBookings      = (params)              => api.get('/bookings', { params });
export const createBooking       = (data)                => api.post('/bookings', data);
export const cancelBooking       = (id)                  => api.patch(`/bookings/${id}/cancel`);
export const rescheduleBooking   = (id, data)            => api.put(`/bookings/${id}/reschedule`, data);
export const approveBooking      = (id)                  => api.patch(`/bookings/${id}/approve`);
export const rejectBooking       = (id, reason)          => api.patch(`/bookings/${id}/reject`, { reason });

// ─── Incidents ─────────────────────────────────────
export const getIncidents            = () => api.get('/incidents');
export const getIncidentById         = (id) => api.get(`/incidents/${id}`);
export const getIncidentAssignees    = () => api.get('/incidents/assignees');
export const assignIncident          = (id, assigneeEmail) => api.patch(`/incidents/${id}/assign`, { assigneeEmail });
export const updateIncidentStatus    = (id, payload) => api.patch(`/incidents/${id}/status`, payload);
export const addIncidentComment      = (id, content) => api.post(`/incidents/${id}/comments`, { content });
export const updateIncidentComment   = (id, commentId, content) => api.put(`/incidents/${id}/comments/${commentId}`, { content });
export const deleteIncidentComment   = (id, commentId) => api.delete(`/incidents/${id}/comments/${commentId}`);

export const createIncident = (payload, files = []) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  files.slice(0, 3).forEach((file) => formData.append('attachments', file));
  return api.post('/incidents', formData);
};

export default api;
