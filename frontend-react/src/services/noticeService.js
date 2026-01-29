import api from './api';

export const noticeService = {
    getAll: async () => {
        const response = await api.get('/notices');
        return response.data;
    },
    getById: (id) => api.get(`/notices/${id}`),
    create: (data) => api.post('/notices', data),
    update: (id, data) => api.put(`/notices/${id}`, data),
    delete: (id) => api.delete(`/notices/${id}`),
    togglePin: (id) => api.put(`/notices/${id}/pin`)
};