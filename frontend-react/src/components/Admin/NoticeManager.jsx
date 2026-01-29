// ==================== src/components/Admin/NoticeManager.jsx ====================
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Edit, Trash2, Pin, X } from 'lucide-react'
import { noticeService } from '../../services/noticeService';

export default function NoticeManager() {
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const queryClient = useQueryClient()

  // ✅ 공지사항 목록 조회
  const { data: notices, isLoading, error } = useQuery({
    queryKey: ['notices'],
    queryFn: noticeService.getAll,
  })

  // ✅ 에러 확인용 추가
  useEffect(() => {
    if (error) {
      console.error('공지사항 조회 실패:', error);
    }
    if (notices) {
      console.log('공지사항 데이터:', notices);
    }
  }, [error, notices]);

  // ✅ 공지사항 생성 Mutation
  const createMutation = useMutation({
    mutationFn: noticeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['notices'])
      setShowModal(false)
      alert('공지사항이 생성되었습니다.')
    },
    onError: (error) => {
      console.error('공지 생성 실패:', error)
      alert('공지사항 생성에 실패했습니다.')
    }
  })

  // ✅ 공지사항 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: ({ noticeId, data }) => noticeService.update(noticeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notices'])
      setShowModal(false)
      setEditingNotice(null)
      alert('공지사항이 수정되었습니다.')
    },
    onError: (error) => {
      console.error('공지 수정 실패:', error)
      alert('공지사항 수정에 실패했습니다.')
    }
  })

  // ✅ 공지사항 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: noticeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['notices'])
      alert('공지사항이 삭제되었습니다.')
    },
    onError: (error) => {
      console.error('공지 삭제 실패:', error)
      alert('공지사항 삭제에 실패했습니다.')
    }
  })

  // ✅ 공지사항 고정/해제 Mutation
  const togglePinMutation = useMutation({
    mutationFn: noticeService.togglePin,
    onSuccess: () => {
      queryClient.invalidateQueries(['notices'])
    },
    onError: (error) => {
      console.error('고정 처리 실패:', error)
      alert('고정 처리에 실패했습니다.')
    }
  })

  const handleEdit = (notice) => {
    setEditingNotice(notice)
    setShowModal(true)
  }

  const handleDelete = (noticeId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(noticeId)
    }
  }

  const handleTogglePin = (noticeId) => {
    togglePinMutation.mutate(noticeId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-300 flex items-center gap-2">
            <Bell className="text-blue-400" />
            Notice Management
          </h1>
          <p className="text-slate-500 mt-2">고객에게 공지할 내용을 관리합니다.</p>
        </div>
        <button
          onClick={() => {
            setEditingNotice(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all"
        >
          <Plus className="h-5 w-5" />
          Create Notice
        </button>
      </div>

      <div className="space-y-4">
        {notices && notices.length > 0 ? (
          notices.map((notice) => (
            <div key={notice.noticeId} className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 p-6 hover:border-blue-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {notice.isPinned && (
                      <Pin className="h-5 w-5 text-blue-400 fill-blue-400/20" />
                    )}
                    <h3 className="text-xl font-semibold text-white">{notice.title}</h3>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getTypeColor(notice.noticeType)}`}>
                      {notice.noticeType}
                    </span>
                  </div>
                  <p className="text-slate-400 mb-3 leading-relaxed">{notice.content}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>👁️ Views: {notice.viewCount}</span>
                    <span>📅 {new Date(notice.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleTogglePin(notice.noticeId)}
                    className={`p-2 rounded-lg transition-all ${notice.isPinned
                      ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                      : 'text-slate-600 hover:text-blue-400 hover:bg-slate-800'
                      }`}
                    title={notice.isPinned ? '고정 해제' : '상단 고정'}
                  >
                    <Pin className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(notice)}
                    className="p-2 text-slate-600 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    title="수정"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(notice.noticeId)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="삭제"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-slate-600">
            <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">등록된 공지사항이 없습니다.</p>
            <p className="text-sm mt-2">새로운 공지를 작성해보세요!</p>
          </div>
        )}
      </div>

      {showModal && (
        <NoticeModal
          notice={editingNotice}
          onClose={() => {
            setShowModal(false)
            setEditingNotice(null)
          }}
          onSubmit={(data) => {
            if (editingNotice) {
              updateMutation.mutate({ noticeId: editingNotice.noticeId, data })
            } else {
              createMutation.mutate(data)
            }
          }}
        />
      )}
    </div>
  )
}

function NoticeModal({ notice, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    noticeType: notice?.noticeType || 'GENERAL',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {notice ? '공지사항 수정' : '새 공지사항 작성'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">제목</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="공지사항 제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">내용</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="공지사항 내용을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">공지 유형</label>
            <select
              value={formData.noticeType}
              onChange={(e) => setFormData({ ...formData, noticeType: e.target.value })}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="GENERAL">일반 공지 (General)</option>
              <option value="MAINTENANCE">서버 점검 (Maintenance)</option>
              <option value="UPDATE">업데이트 (Update)</option>
              <option value="URGENT">긴급 공지 (Urgent)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-300 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              {notice ? '수정하기' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 공지 타입별 색상
function getTypeColor(type) {
  const colors = {
    GENERAL: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    MAINTENANCE: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    UPDATE: 'bg-green-500/10 text-green-400 border border-green-500/20',
    URGENT: 'bg-red-500/10 text-red-400 border border-red-500/20'
  }
  return colors[type] || colors.GENERAL
}