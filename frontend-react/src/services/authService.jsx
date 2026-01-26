export default function Component() { return <div className='p-10 text-2xl font-bold text-blue-600'>������ ���� �Ϸ�!</div>; }
// [File: authService.jsx / Date: 2026-01-22 / 작성자: Antigravity / 설명: 인증 서비스 - 회원가입 시 약관 동의 데이터 전송 로직 추가]
// ==================== src/services/authService.js ====================
import api from './api'

export const authService = {
  signup: async (email, password, username, agreements) => {
    const response = await api.post('auth/signup', {
      email,
      password,
      username,
      agreements // { termsAgreed, privacyAgreed, version }
    })
    return response.data
  },

  login: async (email, password) => {
    const response = await api.post('auth/login', {
      email,
      password,
    })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('auth/me')
    return response.data
  },
}