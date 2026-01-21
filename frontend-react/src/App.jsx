import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Auth 관련 컴포넌트
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import PrivateRoute from './components/Auth/PrivateRoute'

// 새롭게 통합한 대시보드 (DashboardV2 하나로 모든 사용자/관리자 화면 대체)
import UserDashboard from './components/User/DashboardV2'

// 관리자 전용 기능 (필요한 경우 유지)
import UserManagement from './components/Admin/UserManagement'
import NoticeManager from './components/Admin/NoticeManager'

// 레이아웃
import Navbar from './components/Layout/Navbar'

// 관리자 대시보드도 새로운 디자인(V2)을 사용하도록 설정
const AdminDashboard = UserDashboard;

function App() {
  const { user } = useAuthStore()

  return (
    // bg-gray-50을 지우고 bg-slate-950으로 변경했습니다.
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar />
      
      <Routes>
        {/* 공공 경로 (로그인/회원가입) */}
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
        <Route path="/profile" element={
          <PrivateRoute>
            <UserDashboard />
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