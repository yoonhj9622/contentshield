// ==================== src/components/Admin/Dashboard.jsx ====================
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { Users, UserX, AlertTriangle, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// #장소영~ 토큰/rehydrate 상태로 enabled 제어
import { useAuthStore } from '../../stores/authStore'
// #여기까지

export default function AdminDashboard() {
  // #장소영~ rehydrate 완료 + token 있을 때만 API 호출
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const canFetch = hasHydrated && !!token
  // #여기까지

  const { data: allUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getAllUsers,
    // #장소영~ 토큰 준비 전에는 호출 금지(401 섞임 방지)
    enabled: canFetch,
    retry: false,
    // #여기까지
  })

  const { data: flaggedUsers } = useQuery({
    queryKey: ['flaggedUsers'],
    queryFn: adminService.getFlaggedUsers,
    // #장소영~
    enabled: canFetch,
    retry: false,
    // #여기까지
  })

  const { data: suspendedUsers } = useQuery({
    queryKey: ['suspendedUsers'],
    queryFn: adminService.getSuspendedUsers,
    // #장소영~
    enabled: canFetch,
    retry: false,
    // #여기까지
  })

  const stats = {
    totalUsers: allUsers?.length || 0,
    flaggedUsers: flaggedUsers?.length || 0,
    suspendedUsers: suspendedUsers?.length || 0,
    activeUsers: allUsers?.filter((u) => u.status === 'ACTIVE').length || 0,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <AdminStatCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
        <AdminStatCard title="Active Users" value={stats.activeUsers} icon={Activity} color="green" />
        <AdminStatCard title="Flagged Users" value={stats.flaggedUsers} icon={AlertTriangle} color="yellow" />
        <AdminStatCard title="Suspended Users" value={stats.suspendedUsers} icon={UserX} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={generateMockGrowthData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {generateMockActivity().map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.user}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminStatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

function generateMockGrowthData() {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => ({
    month,
    users: Math.floor(Math.random() * 100) + 50,
  }))
}

function generateMockActivity() {
  return [
    { action: 'User suspended', user: 'admin@example.com', time: '5 min ago' },
    { action: 'User flagged', user: 'admin@example.com', time: '10 min ago' },
    { action: 'Notice created', user: 'admin@example.com', time: '1 hour ago' },
  ]
}
