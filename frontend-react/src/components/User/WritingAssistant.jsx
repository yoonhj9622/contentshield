// ==================== src/components/User/WritingAssistant.jsx ====================
import { useState } from 'react'
import { Wand2, Copy, RotateCcw } from 'lucide-react'

export default function WritingAssistant() {
  const [originalText, setOriginalText] = useState('')
  const [improvedText, setImprovedText] = useState('')

  const handleImprove = () => {
    // Mock AI improvement
    setImprovedText(`Improved version: ${originalText}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Writing Assistant</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Text */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Original Text</h2>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Enter your text to improve..."
            rows={10}
            className="w-full px-3 py-2 border rounded"
          />
          <button
            onClick={handleImprove}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
          >
            <Wand2 className="h-5 w-5 mr-2" />
            Improve with AI
          </button>
        </div>

        {/* Improved Text */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Improved Text</h2>
          <div className="px-3 py-2 border rounded bg-gray-50 min-h-[240px]">
            {improvedText || 'AI-improved text will appear here...'}
          </div>
          {improvedText && (
            <div className="mt-4 flex space-x-2">
              <button className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center">
                <Copy className="h-5 w-5 mr-2" />
                Copy
              </button>
              <button className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center">
                <RotateCcw className="h-5 w-5 mr-2" />
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}