// ==================== src/components/User/Suggestions.jsx ====================
import { useState } from 'react'
import { Lightbulb, Send, CheckCircle, Clock } from 'lucide-react'

export default function Suggestions() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const suggestions = [
    { id: 1, title: 'Add dark mode', status: 'SUBMITTED', date: '2024-01-15' },
    { id: 2, title: 'Improve loading speed', status: 'IN_PROGRESS', date: '2024-01-10' },
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    // Submit logic
    alert('Suggestion submitted!')
    setTitle('')
    setContent('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Suggestions</h1>

      {/* Submit Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Submit a Suggestion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Details</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
          >
            <Send className="h-5 w-5 mr-2" />
            Submit Suggestion
          </button>
        </form>
      </div>

      {/* My Suggestions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">My Suggestions</h2>
        </div>
        <div className="divide-y">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                    <h3 className="font-semibold">{suggestion.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{suggestion.date}</p>
                </div>
                <StatusBadge status={suggestion.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    SUBMITTED: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
    IN_PROGRESS: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
    COMPLETED: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Completed' },
  }

  const { icon: Icon, color, label } = config[status] || config.SUBMITTED

  return (
    <span className={`flex items-center px-2 py-1 text-xs rounded ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </span>
  )
}
