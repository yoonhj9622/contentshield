// src/stores/authStore.js
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({ // get을 추가하여 내부 상태 접근 용이하게 변경
      user: null,
      token: null,
      // isAdmin을 상태 값으로 관리하거나 계산된 속성으로 유지
      isAdmin: false, 
      
      setAuth: (user, token) => set({ 
        user, 
        token,
        isAdmin: user?.role === 'ADMIN' // 저장할 때 권한 확인 결과를 함께 저장
      }),
      
      logout: () => {
        // 로그아웃 시 로컬 스토리지 데이터도 확실히 비워줍니다.
        localStorage.removeItem('auth-storage');
        set({ user: null, token: null, isAdmin: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), // 명시적으로 로컬 스토리지 지정
    }
  )
)