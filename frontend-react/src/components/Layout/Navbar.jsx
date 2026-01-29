// Navbar.jsx
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
// Switch를 제거하고 ArrowLeftRight만 남깁니다.
import { Shield, User, Power, ArrowLeftRight } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isAdminMode = location.pathname.startsWith('/admin');
  const isAdmin = user?.role === 'ADMIN';

  const toggleMode = () => {
    if (isAdminMode) {
      navigate('/dashboard');
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white tracking-tight">GUARD AI</h1>

          {/* 🎯 현재 모드 상태 배지 */}
          {isAdmin && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isAdminMode
                ? 'bg-red-900/30 text-red-400 border border-red-900/50'
                : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'
              }`}>
              {isAdminMode ? (
                <><Shield className="inline h-3 w-3 mr-1" />Admin Mode</>
              ) : (
                <><User className="inline h-3 w-3 mr-1" />User Mode</>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* 🔄 관리자용 모드 전환 버튼 (하단 중복 제거 및 Switch 에러 수정) */}
          {isAdmin && (
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {isAdminMode ? 'Switch to User View' : 'Switch to Admin View'}
            </button>
          )}

          <div className="h-6 w-px bg-slate-700 mx-2"></div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Power className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}