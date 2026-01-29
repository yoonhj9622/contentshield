// src/stores/authStore.js
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAdmin: false,

      // #장소영~ rehydrate 완료 여부(토큰 준비되기 전 요청 방지)
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      // #여기까지

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAdmin: user?.role === 'ADMIN',
        }),

      logout: () => {
        localStorage.removeItem('auth-storage')
        set({ user: null, token: null, isAdmin: false, hasHydrated: true })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),

      // #장소영~ persist rehydrate 완료 시점 표시
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // rehydrate 실패해도 앱이 멈추지 않게만 처리
          state?.setHasHydrated(true)
          return
        }
        state?.setHasHydrated(true)
      },
      // #여기까지
    }
  )
)
