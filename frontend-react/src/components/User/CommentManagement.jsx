// ==================== src/components/User/CommentManagement.jsx ====================
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Eye, EyeOff, Trash2 } from 'lucide-react'

export default function CommentManagement() {
  // Mock data - 실제로는 API에서 가져옴
  const comments = [
    { id: 1, text: 'Great video!', author: 'User123', analyzed: true, malicious: false },
    { id: 2, text: 'Bad comment', author: 'User456', analyzed: true, malicious: true },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Comment Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Comment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {comments.map((comment) => (
              <tr key={comment.id}>
                <td className="px-6 py-4">{comment.text}</td>
                <td className="px-6 py-4">{comment.author}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    comment.malicious ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {comment.malicious ? 'Malicious' : 'Safe'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="text-gray-600 hover:text-gray-900">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5" />
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