// ==================== src/services/analysisService.js ====================
import api from './api'

export const analysisService = {
  analyzeComment: async (commentId) => {
    const response = await api.post('/analysis/comment', { commentId })
    return response.data
  },

  getHistory: async () => {
    const response = await api.get('/analysis/history')
    return response.data
  },

  getStats: async () => {
    const response = await api.get('/analysis/stats')
    return response.data
  },
}
