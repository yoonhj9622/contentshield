// ==================== src/components/Admin/UserManagement.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { Search, UserX, Flag, CheckCircle } from 'lucide-react'

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery('adminUsers', adminService.getAllUsers)

  const suspendMutation = useMutation(
    ({ userId, reason, days }) => adminService.suspendUser(userId, reason, days),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers')
        alert('User suspended')
      },
    }
  )

  const flagMutation = useMutation(
    ({ userId, reason }) => adminService.flagUser(userId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers')
        alert('User flagged')
      },
    }
  )

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredUsers?.map((user) => (
              <tr key={user.userId}>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 text-xs rounded w-fit ${
                      user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                    {user.isFlagged && (
                      <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 w-fit">
                        Flagged
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for suspension:')
                      if (reason) {
                        suspendMutation.mutate({ userId: user.userId, reason, days: 7 })
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Suspend user"
                  >
                    <UserX className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for flag:')
                      if (reason) {
                        flagMutation.mutate({ userId: user.userId, reason })
                      }
                    }}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Flag user"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}