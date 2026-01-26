// ==================== src/services/blockedWordService.js ====================
import api from './api';

export const blockedWordService = {
  // 차단 단어 목록 조회
  getBlockedWords: async () => {
    try {
      const response = await api.get('/blocked-words');
      return response.data;
    } catch (error) {
      console.error('Error fetching blocked words:', error);
      throw error;
    }
  },

  // 차단 단어 추가
  addBlockedWord: async (word, category, severity) => {
    try {
      const response = await api.post('/blocked-words', {
        word,
        category,
        severity
      });
      return response.data;
    } catch (error) {
      console.error('Error adding blocked word:', error);
      throw error;
    }
  },

  // 차단 단어 삭제
  deleteBlockedWord: async (wordId) => {
    try {
      const response = await api.delete(`/blocked-words/${wordId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting blocked word:', error);
      throw error;
    }
  },

  // 차단 단어 활성화/비활성화 토글
  toggleBlockedWord: async (wordId) => {
    try {
      const response = await api.patch(`/blocked-words/${wordId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling blocked word:', error);
      throw error;
    }
  },

  // 차단 단어 수정
  updateBlockedWord: async (wordId, data) => {
    try {
      const response = await api.put(`/blocked-words/${wordId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating blocked word:', error);
      throw error;
    }
  }
};