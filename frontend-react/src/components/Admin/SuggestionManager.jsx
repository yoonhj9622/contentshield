// ==================== src/components/Admin/SuggestionManager.jsx ====================
import { useQuery } from '@tanstack/react-query'
import { Lightbulb, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function SuggestionManager() {
  // Mock data
  const suggestions = [
    { id: 1, title: 'Add dark mode', user: 'user@example.com', status: 'SUBMITTED', date: '2024-01-15' },
    { id: 2, title: 'Improve speed', user: 'test@example.com', status: 'IN_PROGRESS', date: '2024-01-10' },
  ]

  const handleRespond = (id) => {
    const response = prompt('Enter your response:')
    if (response) {
      alert('Response sent!')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Suggestion Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Suggestion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suggestions.map((suggestion) => (
              <tr key={suggestion.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {suggestion.user}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={suggestion.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {suggestion.date}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleRespond(suggestion.id)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Respond
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

function StatusBadge({ status }) {
  const config = {
    SUBMITTED: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
    IN_PROGRESS: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
    COMPLETED: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Completed' },
    REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
  }

  const { icon: Icon, color, label } = config[status] || config.SUBMITTED

  return (
    <span className={`flex items-center px-2 py-1 text-xs rounded ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </span>
  )
}
