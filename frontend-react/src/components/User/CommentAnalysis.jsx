// ==================== src/components/User/CommentAnalysis.jsx ====================
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analysisService } from '../../services/analysisService'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function CommentAnalysis() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const queryClient = useQueryClient()

  const analysisMutation = useMutation(
    //윤혜정
    (textData) => analysisService.analyzeText(textData.text),
    // (commentData) => analysisService.analyzeComment(commentData.commentId),
    {
      onSuccess: (data) => {
        setResult(data)
        queryClient.invalidateQueries('analysisHistory')
      },
    }
  )

  const handleAnalyze = () => {
    if (!text.trim()) return
    
    // Mock comment ID - 실제로는 댓글 ID를 받아야 함
    //analysisMutation.mutate({ commentId: Date.now() })
    //윤혜정
    analysisMutation.mutate({ text: text.trim() })  // text 전달
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Comment Analysis</h1>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter comment text to analyze
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Paste the comment you want to analyze..."
        />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!text.trim() || analysisMutation.isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {analysisMutation.isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Analyzing...
              </>
            ) : (
              'Analyze Comment'
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            {result.isMalicious ? (
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {result.isMalicious ? 'Malicious Content Detected' : 'Safe Content'}
              </h2>
              <p className="text-gray-600">
                Category: {result.category}
              </p>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <ScoreBar label="Toxicity" score={result.toxicityScore} />
            <ScoreBar label="Hate Speech" score={result.hateSpeechScore} />
            <ScoreBar label="Profanity" score={result.profanityScore} />
            <ScoreBar label="Threat" score={result.threatScore} />
            <ScoreBar label="Violence" score={result.violenceScore} />
            <ScoreBar label="Confidence" score={result.confidenceScore} />
          </div>

          {/* Reasoning */}
          {result.aiReasoning && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-700">{result.aiReasoning}</p>
            </div>
          )}

          {/* Detected Keywords */}
          {result.detectedKeywords?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Detected Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {result.detectedKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreBar({ label, score }) {
  const percentage = Math.min(Math.max(score, 0), 100)
  const color =
    percentage > 70 ? 'bg-red-500' :
    percentage > 40 ? 'bg-yellow-500' :
    'bg-green-500'

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
