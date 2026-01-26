// ==================== src/components/Admin/LogViewer.jsx ====================
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { FileText, Download, Filter } from 'lucide-react'

export default function LogViewer() {
  const [logType, setLogType] = useState('admin')

  const { data: adminLogs } = useQuery(
    ['adminLogs', logType],
    () => adminService.getAdminLogs(),
    { enabled: logType === 'admin' }
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
        <div className="flex space-x-2">
          <select
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="admin">Admin Logs</option>
            <option value="user">User Activity</option>
            <option value="system">System Logs</option>
          </select>
          <button className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminLogs?.map((log, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    Admin #{log.adminId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.targetType} #{log.targetId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
