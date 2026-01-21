// ==================== src/services/userService.js ====================
import api from './api'

export const userService = {
  getProfile: async () => {
    const response = await api.get('/user/profile')
    return response.data
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData)
    return response.data
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/user/password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },

  getSubscription: async () => {
    const response = await api.get('/user/subscription')
    return response.data
  },
}