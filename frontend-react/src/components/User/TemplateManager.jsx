import { useState } from 'react'
import {
  Wand2, Copy, CheckCircle, AlertTriangle,
  XCircle, MessageSquare, FileText, Send,
  Sparkles, Loader2, AlertCircle
} from 'lucide-react'
import analysisService from '../../services/analysisService'

export default function WritingAssistant() {
  // ==================== 상태 ====================
  const [activeTab, setActiveTab] = useState('improve')
  const [originalText, setOriginalText] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [copiedVersion, setCopiedVersion] = useState(null)

  const [tone, setTone] = useState('polite')
  const [situation, setSituation] = useState('promotion')
  const [replyType, setReplyType] = useState('constructive')


  // ==================== 상수 ====================
  const tabs = [
    { id: 'improve', label: '텍스트 개선', icon: Sparkles },
    { id: 'reply', label: '댓글 답변', icon: MessageSquare },
    { id: 'template', label: '템플릿 생성', icon: FileText }
  ]

  const tones = [
    { value: 'polite', label: '공손하게' },
    { value: 'neutral', label: '중립적' },
    { value: 'friendly', label: '친근하게' },
    { value: 'formal', label: '격식있게' },
    { value: 'casual', label: '편안하게' }
  ]

  const situations = [
    { value: 'promotion', label: '홍보/마케팅' },
    { value: 'announcement', label: '공지/안내' },
    { value: 'apology', label: '사과/해명' },
    { value: 'explanation', label: '상황 설명' }
  ]

  // ==================== API ====================
  // ==================== API ====================
  const handleAnalyze = async () => {
    if (activeTab === 'template' && !topic.trim()) {
      setError('작성할 내용을 입력해주세요')
      return
    }

    if (activeTab !== 'template' && !originalText.trim()) {
      setError('텍스트를 입력해주세요')
      return
    }

    setLoading(true)
    setAnalyzed(false)
    setSuggestions([])
    setError(null)

    try {
      let data;

      if (activeTab === 'improve') {
        data = await analysisService.assistantImprove(originalText, tone, 'ko')
      }

      if (activeTab === 'reply') {
        data = await analysisService.assistantReply(originalText, null, replyType, 'ko')
      }

      if (activeTab === 'template') {
        data = await analysisService.assistantTemplate(situation, topic, tone, 'ko')
      }

      setSuggestions(data.suggestions || [])
      setAnalyzed(true)

    } catch (err) {
      console.error(err)
      setError(err.message || '분석 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text, version) => {
    await navigator.clipboard.writeText(text)
    setCopiedVersion(version)
    setTimeout(() => setCopiedVersion(null), 1500)
  }

  // ==================== UI ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b1c] to-[#020617] text-gray-100 p-8">
      {/* 헤더 */}
      <h1 className="text-3xl font-bold flex items-center mb-6">
        <Wand2 className="h-7 w-7 mr-3 text-primary-500" />
        AI Writing Assistant
      </h1>

      {/* 탭 */}
      <div className="flex gap-3 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setOriginalText('')
                setTopic('')
                setAnalyzed(false)
                setSuggestions([])
              }}
              className={`px-4 py-2 rounded-lg flex items-center text-sm
                ${activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-gray-400'}
              `}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 입력 카드 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 space-y-4">

        {/* 텍스트 개선 / 댓글 */}
        {activeTab !== 'template' && (
          <textarea
            value={originalText}
            onChange={e => setOriginalText(e.target.value)}
            placeholder={activeTab === 'improve' ? '개선할 텍스트 입력' : '댓글 입력'}
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-sm"
          />
        )}

        {/* 템플릿 생성 전용 UI */}
        {activeTab === 'template' && (
          <>
            <select
              value={situation}
              onChange={e => setSituation(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm"
            >
              {situations.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm"
            >
              {tones.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="작성할 상황이나 주제를 입력하세요"
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-sm"
            />
          </>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 bg-primary-600 rounded-lg flex items-center"
          >
            {loading
              ? <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              : <Send className="h-5 w-5 mr-2" />}
            AI 실행
          </button>
        </div>
      </div>

      {/* 결과 */}
      {analyzed && (
        <div className="grid md:grid-cols-3 gap-6">
          {suggestions.map(s => (
            <div key={s.version} className="bg-white/5 p-5 rounded-xl border border-white/10">
              <p className="text-primary-400 font-semibold mb-2">
                Version {s.version}
              </p>
              <div className="text-sm bg-black/30 p-4 rounded-lg min-h-[120px]">
                {s.text}
              </div>

              <button
                onClick={() => handleCopy(s.text, s.version)}
                className="mt-3 text-sm w-full bg-white/10 rounded-lg py-2"
              >
                {copiedVersion === s.version ? '복사됨' : '복사'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex">
          <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
