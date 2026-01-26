// ==================== src/components/User/BlacklistManager.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blacklistService } from '../../services/blacklistService'
import { UserX, Trash2, Plus, MessageSquare } from 'lucide-react'

export default function BlacklistManager() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedComment, setSelectedComment] = useState(null)
  const queryClient = useQueryClient()

  const { data: blacklist, isLoading } = useQuery('blacklist', blacklistService.getBlacklist)

  const removeMutation = useMutation(
    (blacklistId) => blacklistService.removeFromBlacklist(blacklistId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blacklist')
      },
    }
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Blacklist Manager</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add to Blacklist
        </button>
      </div>

      {/* Blacklist Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Violations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Comment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Added
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : blacklist?.length > 0 ? (
              blacklist.map((item) => (
                <tr key={item.blacklistId}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <UserX className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium">{item.blockedAuthorName}</p>
                        <p className="text-sm text-gray-500">{item.blockedAuthorIdentifier}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded bg-gray-100">
                      {item.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                      {item.violationCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.reason}
                  </td>
                  <td className="px-6 py-4">
                    {item.commentText ? (
                      <button
                        onClick={() => setSelectedComment(item.commentText)}
                        className="flex items-center text-primary-600 hover:text-primary-800"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span className="text-sm">View</span>
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => removeMutation.mutate(item.blacklistId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No blocked users yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddBlacklistModal onClose={() => setShowAddModal(false)} />
      )}

      {/* Comment View Modal */}
      {selectedComment && (
        <CommentModal 
          comment={selectedComment} 
          onClose={() => setSelectedComment(null)} 
        />
      )}
    </div>
  )
}

function AddBlacklistModal({ onClose }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    blockedAuthorName: '',
    blockedAuthorIdentifier: '',
    platform: 'YOUTUBE',
    reason: '',
  })

  const addMutation = useMutation(
    (data) => blacklistService.addToBlacklist(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blacklist')
        onClose()
      },
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    addMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Add to Blacklist</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Author Name</label>
            <input
              type="text"
              required
              value={formData.blockedAuthorName}
              onChange={(e) => setFormData({...formData, blockedAuthorName: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Author ID</label>
            <input
              type="text"
              required
              value={formData.blockedAuthorIdentifier}
              onChange={(e) => setFormData({...formData, blockedAuthorIdentifier: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              required
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CommentModal({ comment, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">악성 댓글 내용</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-gray-800 whitespace-pre-wrap">{comment}</p>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}