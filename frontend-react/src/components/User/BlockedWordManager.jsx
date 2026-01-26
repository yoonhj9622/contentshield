// ==================== src/components/User/BlockedWordManager.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../services/api'

const blockedWordService = {
  getWords: async () => {
    const response = await api.get('/blocked-words')
    return response.data
  },
  
  addWord: async (data) => {
    const response = await api.post('/blocked-words', data)
    return response.data
  },
  
  toggleWord: async (wordId) => {
    const response = await api.patch(`/blocked-words/${wordId}/toggle`)
    return response.data
  },
  
  deleteWord: async (wordId) => {
    const response = await api.delete(`/blocked-words/${wordId}`)
    return response.data
  }
}

const CATEGORIES = [
  { value: 'PROFANITY', label: '욕설', color: 'bg-red-100 text-red-800' },
  { value: 'HATE', label: '혐오', color: 'bg-orange-100 text-orange-800' },
  { value: 'VIOLENCE', label: '폭력', color: 'bg-purple-100 text-purple-800' },
  { value: 'SEXUAL', label: '성적', color: 'bg-pink-100 text-pink-800' },
  { value: 'SPAM', label: '스팸', color: 'bg-gray-100 text-gray-800' }
]

const SEVERITIES = [
  { value: 'LOW', label: '보통', color: 'bg-blue-100 text-blue-800' },
  { value: 'MEDIUM', label: '보통', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: '심각', color: 'bg-red-100 text-red-800' }
]

export default function BlockedWordManager() {
  const [showAddModal, setShowAddModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: words, isLoading } = useQuery('blockedWords', blockedWordService.getWords)

  const toggleMutation = useMutation(
    (wordId) => blockedWordService.toggleWord(wordId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blockedWords')
        queryClient.invalidateQueries('comments') // 댓글 목록도 새로고침
      }
    }
  )

  const deleteMutation = useMutation(
    (wordId) => blockedWordService.deleteWord(wordId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blockedWords')
        queryClient.invalidateQueries('comments')
      }
    }
  )

  const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0]
  }

  const getSeverityInfo = (severity) => {
    return SEVERITIES.find(s => s.value === severity) || SEVERITIES[1]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            차단 단어 관리
          </h1>
          <p className="text-gray-600 mt-2">
            등록된 단어가 포함된 댓글을 자동으로 표시합니다
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          단어 추가
        </button>
      </div>

      {/* 차단 단어 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                단어
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                카테고리
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                심각도
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : words?.length > 0 ? (
              words.map((word) => {
                const categoryInfo = getCategoryInfo(word.category)
                const severityInfo = getSeverityInfo(word.severity)
                
                return (
                  <tr key={word.wordId} className={!word.isActive ? 'opacity-50' : ''}>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{word.word}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${severityInfo.color}`}>
                        {severityInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        word.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {word.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button
                          onClick={() => toggleMutation.mutate(word.wordId)}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                          title={word.isActive ? '비활성화' : '활성화'}
                        >
                          {word.isActive ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${word.word}"를 삭제하시겠습니까?`)) {
                              deleteMutation.mutate(word.wordId)
                            }
                          }}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          title="삭제"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  등록된 차단 단어가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <AddWordModal 
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

function AddWordModal({ onClose }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    word: '',
    category: 'PROFANITY',
    severity: 'MEDIUM'
  })

  const addMutation = useMutation(
    (data) => blockedWordService.addWord(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blockedWords')
        queryClient.invalidateQueries('comments')
        onClose()
      },
      onError: (error) => {
        alert(error.response?.data?.error || '추가에 실패했습니다')
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.word.trim()) {
      alert('단어를 입력해주세요')
      return
    }
    addMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">차단 단어 추가</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">단어</label>
            <input
              type="text"
              required
              value={formData.word}
              onChange={(e) => setFormData({...formData, word: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="차단할 단어 입력"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">심각도</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({...formData, severity: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITIES.map(sev => (
                <option key={sev.value} value={sev.value}>{sev.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={addMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {addMutation.isLoading ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}