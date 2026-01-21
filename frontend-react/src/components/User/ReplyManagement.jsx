// ==================== src/components/User/ReplyManagement.jsx ====================
import { useState } from 'react'
import { Send, FileText } from 'lucide-react'

export default function ReplyManagement() {
  const [replyText, setReplyText] = useState('')

  const replies = [
    { id: 1, commentText: 'Question about product', replyText: 'Thanks for asking!', posted: true },
    { id: 2, commentText: 'Another question', replyText: 'Will reply soon', posted: false },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reply Management</h1>

      {/* Quick Reply Box */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Reply</h2>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Type your reply..."
          rows={4}
          className="w-full px-3 py-2 border rounded"
        />
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Send Reply
          </button>
        </div>
      </div>

      {/* Replies List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Replies</h2>
        </div>
        <div className="divide-y">
          {replies.map((reply) => (
            <div key={reply.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Replying to:</p>
                  <p className="font-medium mb-2">{reply.commentText}</p>
                  <p className="text-gray-700">{reply.replyText}</p>
                </div>
                <span className={`ml-4 px-2 py-1 text-xs rounded ${
                  reply.posted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {reply.posted ? 'Posted' : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
