// ==================== src/components/Layout/Sidebar.jsx ====================
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileSearch, 
  BarChart3, 
  UserX, 
  Settings,
  MessageSquare,
  Lightbulb,
  Users,
  Bell,
  FileText
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function Sidebar() {
  const location = useLocation()
  const { user } = useAuthStore()

  const isActive = (path) => {
    return location.pathname === path
  }

  const linkClass = (path) => {
    const base = "flex items-center px-4 py-3 text-sm font-medium transition-colors"
    return isActive(path)
      ? `${base} bg-primary-50 text-primary-700 border-r-4 border-primary-600`
      : `${base} text-gray-700 hover:bg-gray-50`
  }

  const userLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analysis', icon: FileSearch, label: 'Comment Analysis' },
    { path: '/statistics', icon: BarChart3, label: 'Statistics' },
    { path: '/blacklist', icon: UserX, label: 'Blacklist Manager' },
    { path: '/templates', icon: MessageSquare, label: 'Templates' },
    { path: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
    { path: '/profile', icon: Settings, label: 'Settings' },
  ]

  const adminLinks = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/notices', icon: Bell, label: 'Notices' },
    { path: '/admin/logs', icon: FileText, label: 'System Logs' },
  ]

  return (
    <div className="w-64 bg-white h-screen border-r overflow-y-auto">
      <div className="py-4">
        {/* User Navigation */}
        <div className="px-4 mb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            User Menu
          </h3>
        </div>
        
        <nav className="space-y-1">
          {userLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={linkClass(link.path)}
            >
              <link.icon className="h-5 w-5 mr-3" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Admin Navigation */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="px-4 mt-6 mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin Menu
              </h3>
            </div>
            
            <nav className="space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={linkClass(link.path)}
                >
                  <link.icon className="h-5 w-5 mr-3" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
