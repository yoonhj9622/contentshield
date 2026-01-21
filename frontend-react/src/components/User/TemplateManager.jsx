// ==================== src/components/User/TemplateManager.jsx ====================
import { useState } from 'react'
import { FileText, Plus, Edit, Trash2 } from 'lucide-react'

export default function TemplateManager() {
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Welcome Reply', content: 'Thank you for your comment!', category: 'General' },
    { id: 2, name: 'FAQ Reply', content: 'Please check our FAQ section...', category: 'Support' },
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Template Manager</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-3">
              <FileText className="h-8 w-8 text-primary-600" />
              <div className="flex space-x-2">
                <button className="text-gray-600 hover:text-gray-900">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-900">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{template.content}</p>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
              {template.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}