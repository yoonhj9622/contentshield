// [File: App.jsx / Date: 2026-01-25 / 작성자: Antigravity / 설명: 대시보드 메뉴별 독립적 Top-level URL 라우팅 적용]
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Auth 관련 컴포넌트
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import PrivateRoute from './components/Auth/PrivateRoute'

// 통합 대시보드 (V2)
import UserDashboard from './components/User/DashboardV2'

// ✅ Template Manager (AI Writing Assistant 역할)
import TemplateManager from './components/User/TemplateManager'

// ✅ Blocked Word Manager (차단 단어 관리)
import BlockedWordManager from './components/User/BlockedWordManager'

// 관리자 전용 기능
import UserManagement from './components/Admin/UserManagement'
import NoticeManager from './components/Admin/NoticeManager'

// 레이아웃
import Navbar from './components/Layout/Navbar'

// 관리자도 동일한 DashboardV2 사용
const AdminDashboard = UserDashboard

function App() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar />

      <Routes>
        {/* =======================
            공공 경로
        ======================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 사용자 경로 (모두 통합 대시보드 V2로 연결) */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/analysis" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/aianalysis" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/comments" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/statistics" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/blacklist" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/aiassistant" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/templates" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />

        {/* 🧠 Template Manager (독립 페이지 - sieun) */}
        <Route path="/writing" element={
          <PrivateRoute>
            <TemplateManager />
          </PrivateRoute>
        } />

        {/* 🚫 Blocked Word Manager (차단 단어 관리 - 독립 페이지) */}
        <Route path="/blocked-words" element={
          <PrivateRoute>
            <BlockedWordManager />
          </PrivateRoute>
        } />

        {/* 관리자 경로 */}
        <Route path="/admin/dashboard" element={
          <PrivateRoute requireAdmin>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute requireAdmin>
            <UserManagement />
          </PrivateRoute>
        } />
        <Route path="/admin/notices" element={
          <PrivateRoute requireAdmin>
            <NoticeManager />
          </PrivateRoute>
        } />

        {/* 기본 리다이렉트 설정 */}
        <Route path="/" element={
          user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
      </Routes>
    </div>
  )
}

export default App