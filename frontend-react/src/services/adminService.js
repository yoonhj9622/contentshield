// ==================== src/services/adminService.js ====================
import api from './api'

export const adminService = {
  getAllUsers: async () => {
    const response = await api.get('/admin/users')
    return response.data
  },

  getUserDetail: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  suspendUser: async (userId, reason, days) => {
    const response = await api.put(`/admin/users/${userId}/suspend`, {
      reason,
      days,
    })
    return response.data
  },

  unsuspendUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/unsuspend`)
    return response.data
  },

  flagUser: async (userId, reason) => {
    const response = await api.put(`/admin/users/${userId}/flag`, { reason })
    return response.data
  },

  unflagUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/unflag`)
    return response.data
  },

  getAdminLogs: async (adminId) => {
    const response = await api.get('/admin/logs/admin', {
      params: { adminId },
    })
    return response.data
  },

  getFlaggedUsers: async () => {
    const response = await api.get('/admin/users/flagged')
    return response.data
  },

  getSuspendedUsers: async () => {
    const response = await api.get('/admin/users/suspended')
    return response.data
  },
}