export default function Component() { return <div className='p-10 text-2xl font-bold text-blue-600'>������ ���� �Ϸ�!</div>; }
// ==================== src/services/authService.js ====================
import api from './api'

export const authService = {
  signup: async (email, password, username) => {
    const response = await api.post('/auth/signup', {
      email,
      password,
      username,
    })
    return response.data
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}