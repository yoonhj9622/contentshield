// ==================== src/services/userService.js ====================
import api from './api'

export const userService = {
  /**
   * 사용자 계정 정보 조회
   */
  getUserInfo: async () => {
    try {
      const response = await api.get('/user/info')
      return response.data
    } catch (error) {
      console.error('Failed to get user info:', error)
      throw error
    }
  },

  /**
   * 사용자 프로필 조회
   */
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile')
      return response.data
    } catch (error) {
      console.error('Failed to get profile:', error)
      throw error
    }
  },

  /**
   * 사용자 프로필 업데이트
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData)
      return response.data
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  },

  /**
   * 비밀번호 변경
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/user/password', {
        currentPassword,
        newPassword,
      })
      return response.data
    } catch (error) {
      console.error('Failed to change password:', error)
      throw error
    }
  },

  /**
   * 구독 정보 조회
   */
  getSubscription: async () => {
    try {
      const response = await api.get('/user/subscription')
      return response.data
    } catch (error) {
      console.error('Failed to get subscription:', error)
      throw error
    }
  },

  /**
   * 프로필 이미지 업로드
   */
  uploadProfileImage: async (imageFile) => {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      
      const response = await api.post('/user/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error('Failed to upload profile image:', error)
      throw error
    }
  },
}