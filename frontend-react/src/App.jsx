// [File: App.jsx / Date: 2026-01-25 / 작성자: Antigravity / 설명: 사이드바 레이아웃 적용 버전]
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Auth 관련 컴포넌트
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import PrivateRoute from './components/Auth/PrivateRoute'

// 레이아웃 컴포넌트
import Navbar from './components/Layout/Navbar'
import Sidebar from './components/Layout/Sidebar' // ✅ 사이드바 임포트

// 통합 대시보드 (V2) - 사용자용
import UserDashboard from './components/User/DashboardV2'

// ✅ 관리자 전용 대시보드 (분리)
import AdminDashboard from './components/Admin/Dashboard'

// ✅ Template Manager (AI Writing Assistant 역할)
import TemplateManager from './components/User/TemplateManager'

// ✅ Blocked Word Manager (차단 단어 관리)
import BlockedWordManager from './components/User/BlockedWordManager'

// 관리자 전용 기능
import UserManagement from './components/Admin/UserManagement'
import NoticeManager from './components/Admin/NoticeManager'
import LogViewer from './components/Admin/LogViewer'
import SuggestionManager from './components/Admin/SuggestionManager'
function App() {
  const { user } = useAuthStore()

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* 1. 왼쪽 사이드바: 로그인했을 때만 노출 */}
      {user && <Sidebar />}
      {/* 2. 오른쪽 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 상단 네비바 */}
      <Navbar />
<main className="flex-1 overflow-y-auto p-6">
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

        {/* 🧠 Template Manager (독립 페이지) */}
        <Route path="/writing" element={
          <PrivateRoute>
            <TemplateManager />
          </PrivateRoute>
        } />

        {/* 🚫 Blocked Word Manager (차단 단어 관리) */}
        <Route path="/blocked-words" element={
          <PrivateRoute>
            <BlockedWordManager />
          </PrivateRoute>
        } />

        {/* =============================
            관리자 경로 (Admin 전용)
        ============================= */}
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
        <Route path="/admin/logs" element={
          <PrivateRoute requireAdmin>
            <LogViewer />
          </PrivateRoute>
        } />

        <Route path="/admin/suggestions" element={
          <PrivateRoute requireAdmin>
            <SuggestionManager />
          </PrivateRoute>
        } />

        {/* 기본 리다이렉트 설정 (역할별 분기) */}
        <Route path="/" element={
          user 
            ? <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} />
            : <Navigate to="/login" />
        } />
      </Routes>
      </main>
    </div>
    </div>
  )
}

export default App