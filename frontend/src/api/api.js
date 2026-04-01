import axios from 'axios';

// 1. Axios Instance එක හදන්න
const api = axios.create({
  baseURL: 'http://localhost:8081/api',
});

// 2. Request Interceptor එක - හැම Request එකකටම Token එක එකතු කරයි
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
// දැන් හැම තැනම පාවිච්චි කරන්නේ උඩ හදපු "api" instance එකමයි
export const getMe = () => api.get('/users/me');

// ─── Notifications ─────────────────────────────────
export const getNotifications    = ()    => api.get('/notifications');
export const getUnreadCount      = ()    => api.get('/notifications/count');
export const markAsRead          = (id)  => api.patch(`/notifications/${id}/read`);
export const markAllAsRead       = ()    => api.patch('/notifications/read-all');
export const deleteNotification  = (id)  => api.delete(`/notifications/${id}`);

// ─── Users / Admin ─────────────────────────────────
export const getAllUsers         = ()            => api.get('/users');
export const updateUserRole      = (id, role)    => api.put(`/users/${id}/roles`, { roles: [role] });

// ─── Resources ─────────────────────────────────────
export const getResources        = ()         => api.get('/resources');
export const createResource      = (data)     => api.post('/resources', data);
export const updateResource      = (id, data) => api.put(`/resources/${id}`, data);
export const deleteResource      = (id)       => api.delete(`/resources/${id}`);

// ─── Bookings ──────────────────────────────────────
export const getBookings         = ()          => api.get('/bookings');
export const createBooking       = (data)      => api.post('/bookings', data);
export const updateBooking       = (id, data)  => api.put(`/bookings/${id}`, data);
export const deleteBooking       = (id)        => api.delete(`/bookings/${id}`);

export default api;