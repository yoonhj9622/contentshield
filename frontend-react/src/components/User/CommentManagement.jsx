// ==================== src/components/User/CommentManagement.jsx ====================
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Eye, EyeOff, Trash2, UserX, AlertTriangle } from 'lucide-react'
import { commentService } from '../../services/commentService'
import { blacklistService } from '../../services/blacklistService'

export default function CommentManagement() {
  const [selectedComment, setSelectedComment] = useState(null)
  const queryClient = useQueryClient()

  // 댓글 목록 조회
  const { data: comments, isLoading } = useQuery(
    'comments',
    () => commentService.getComments(null)
  )

  // 블랙리스트 추가 mutation
  const addToBlacklistMutation = useMutation(
    (commentData) => blacklistService.addToBlacklist({
      authorName: commentData.authorName,
      authorIdentifier: commentData.authorIdentifier,
      platform: commentData.platform || 'YOUTUBE',
      reason: '악성 댓글 작성',
      commentText: commentData.content,
      channelId: null
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blacklist')
        alert('블랙리스트에 추가되었습니다.')
      },
      onError: (error) => {
        console.error('블랙리스트 추가 실패:', error)
        alert('블랙리스트 추가에 실패했습니다.')
      }
    }
  )

  const handleAddToBlacklist = (comment) => {
    if (confirm(`${comment.authorName}을(를) 블랙리스트에 추가하시겠습니까?`)) {
      addToBlacklistMutation.mutate({
        authorName: comment.authorName,
        authorIdentifier: comment.authorIdentifier,
        platform: comment.platform,
        content: comment.content
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comment Management</h1>
          <p className="text-gray-600 mt-2">
            총 {comments?.length || 0}개의 댓글
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Comment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Platform
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
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  Loading comments...
                </td>
              </tr>
            ) : comments?.length > 0 ? (
              comments.map((comment) => (
                <tr key={comment.commentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {comment.content}
                        </p>
                        {comment.contentUrl && (
                          <a 
                            href={comment.contentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            View Original →
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {comment.authorName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {comment.authorIdentifier}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {comment.platform || 'YOUTUBE'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {comment.isAnalyzed ? (
                        <span className={`px-2 py-1 text-xs rounded inline-flex items-center ${
                          comment.isMalicious 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {comment.isMalicious && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {comment.isMalicious ? 'Malicious' : 'Safe'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                          Not Analyzed
                        </span>
                      )}
                      {comment.isBlacklisted && (
                        <span className="px-2 py-1 text-xs rounded bg-gray-800 text-white">
                          Blacklisted
                        </span>
                      )}
                      {comment.containsBlockedWord && (
                        <span 
                          className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800 inline-flex items-center"
                          title={`차단 단어 포함: ${comment.matchedBlockedWord}`}
                        >
                          🚫 차단 단어
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {comment.commentedAt 
                      ? new Date(comment.commentedAt).toLocaleDateString()
                      : new Date(comment.createdAt).toLocaleDateString()
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <button
                        onClick={() => setSelectedComment(comment)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {comment.isMalicious && !comment.isBlacklisted && (
                        <button
                          onClick={() => handleAddToBlacklist(comment)}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          title="Add to Blacklist"
                          disabled={addToBlacklistMutation.isLoading}
                        >
                          <UserX className="h-5 w-5" />
                        </button>
                      )}
                      {comment.isHidden ? (
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Hidden"
                        >
                          <EyeOff className="h-5 w-5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No comments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comment Detail Modal */}
      {selectedComment && (
        <CommentDetailModal 
          comment={selectedComment} 
          onClose={() => setSelectedComment(null)}
          onAddToBlacklist={handleAddToBlacklist}
        />
      )}
    </div>
  )
}

function CommentDetailModal({ comment, onClose, onAddToBlacklist }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comment Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Author Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Author Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{comment.authorName}</span>
            </div>
            <div>
              <span className="text-gray-600">ID:</span>
              <span className="ml-2 font-mono text-xs">{comment.authorIdentifier}</span>
            </div>
            <div>
              <span className="text-gray-600">Platform:</span>
              <span className="ml-2">{comment.platform || 'YOUTUBE'}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              {comment.isBlacklisted ? (
                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-800 text-white">
                  Blacklisted
                </span>
              ) : (
                <span className="ml-2 text-gray-600">Active</span>
              )}
            </div>
          </div>
        </div>

        {/* Comment Content */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Comment Text</h3>
          <div className={`p-4 rounded-lg border ${
            comment.isMalicious 
              ? 'bg-red-50 border-red-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
          </div>
          {comment.contentUrl && (
            <a 
              href={comment.contentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-blue-600 hover:underline"
            >
              View original comment →
            </a>
          )}
        </div>

        {/* Analysis Status */}
        {comment.isAnalyzed && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Analysis Result</h3>
            <div className={`p-4 rounded-lg ${
              comment.isMalicious ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <div className="flex items-center">
                {comment.isMalicious ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-semibold text-red-900">Malicious Content Detected</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-green-900">Safe Content</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          {comment.isMalicious && !comment.isBlacklisted && (
            <button
              onClick={() => {
                onAddToBlacklist(comment)
                onClose()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            >
              <UserX className="h-4 w-4 mr-2" />
              Add to Blacklist
            </button>
          )}
        </div>
      </div>
    </div>
  )
}