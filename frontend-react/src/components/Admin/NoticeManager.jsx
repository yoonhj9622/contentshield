// ==================== src/components/Admin/NoticeManager.jsx ====================
import { useState } from 'react'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Edit, Trash2, Pin } from 'lucide-react'

export default function NoticeManager() {
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  // Mock query - 실제로는 noticeService.getAllNotices()
  const { data: notices } = useQuery('notices', () => Promise.resolve([
    { noticeId: 1, title: 'System Maintenance', content: 'Scheduled maintenance...', isPinned: true, viewCount: 100 },
    { noticeId: 2, title: 'New Feature Released', content: 'We are happy to announce...', isPinned: false, viewCount: 50 },
  ]))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notice Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Notice
        </button>
      </div>

      <div className="space-y-4">
        {notices?.map((notice) => (
          <div key={notice.noticeId} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {notice.isPinned && (
                    <Pin className="h-5 w-5 text-primary-600" />
                  )}
                  <h3 className="text-xl font-semibold">{notice.title}</h3>
                </div>
                <p className="text-gray-600 mb-2">{notice.content}</p>
                <p className="text-sm text-gray-500">Views: {notice.viewCount}</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900">
                  <Edit className="h-5 w-5" />
                </button>
                <button className="p-2 text-red-600 hover:text-red-900">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && <NoticeModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

function NoticeModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    noticeType: 'GENERAL',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Submit logic
    alert('Notice created!')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Create Notice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.noticeType}
              onChange={(e) => setFormData({...formData, noticeType: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="GENERAL">General</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="UPDATE">Update</option>
              <option value="URGENT">Urgent</option>
            </select>
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}