// ==================== src/services/blacklistService.js ====================
import api from './api'

export const blacklistService = {
  getBlacklist: async () => {
    const response = await api.get('/blacklist')
    return response.data
  },

  addToBlacklist: async (data) => {
    const response = await api.post('/blacklist', data)
    return response.data
  },

  removeFromBlacklist: async (blacklistId) => {
    const response = await api.delete(`/blacklist/${blacklistId}`)
    return response.data
  },
}