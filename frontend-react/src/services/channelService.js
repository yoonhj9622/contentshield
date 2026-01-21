// ==================== src/services/channelService.js ====================
import api from './api'

export const channelService = {
  getChannels: async () => {
    const response = await api.get('/channels')
    return response.data
  },

  addChannel: async (channelData) => {
    const response = await api.post('/channels', channelData)
    return response.data
  },

  verifyChannel: async (channelId) => {
    const response = await api.post(`/channels/${channelId}/verify`)
    return response.data
  },

  deleteChannel: async (channelId) => {
    const response = await api.delete(`/channels/${channelId}`)
    return response.data
  },
}