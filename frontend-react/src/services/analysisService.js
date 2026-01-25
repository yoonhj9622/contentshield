// ==================== src/services/analysisService.js ====================

import api from './api'; // Ensure this exists or use fetch. Let's assume api was used in HEAD.
// But to be safe and consistent with sieun, I will use fetch for everything if api import is missing.
// Actually, I'll try to use the existing `api` instance if possible, but since I can't see the import, I'll stick to fetch for safety or define a simple fetch wrapper.

const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000'
const SPRING_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

// === Legacy Methods (from HEAD) ===
export const analyzeComment = async (commentId) => {
  const response = await fetch(`${SPRING_API_URL}/analysis/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentId })
  });
  if (!response.ok) throw new Error('Failed to analyze comment');
  return response.json();
}

export const getHistory = async () => {
  const response = await fetch(`${SPRING_API_URL}/analysis/history`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}

export const getStats = async () => {
  const response = await fetch(`${SPRING_API_URL}/analysis/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

// 윤혜정 텍스트 직접 분석 (신규 - HEAD) -> sieun's analyzeText replaces this effectively?
// sieun's analyzeText is more robust. I'll keep sieun's version below.

/**
 * AI Assistant API 서비스
 * FastAPI 백엔드와 통신하는 함수들
 */

// ==================== 기존 콘텐츠 분석 API (유지) ====================

/**
 * 텍스트 악성 콘텐츠 분석 (Dual Model)
 * @param {string} text - 분석할 텍스트
 * @param {string} language - 언어 코드 (ko, en)
 * @param {boolean} useDualModel - 듀얼 모델 사용 여부
 * @returns {Promise<Object>} 분석 결과
 */
export const analyzeText = async (text, language = 'ko', useDualModel = true) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
        use_dual_model: useDualModel
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '분석 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('Text analysis failed:', error)
    throw error
  }
}

/**
 * 대량 텍스트 분석
 * @param {string[]} texts - 분석할 텍스트 배열
 * @param {string} language - 언어 코드
 * @param {boolean} useDualModel - 듀얼 모델 사용 여부
 * @returns {Promise<Object>} 분석 결과 배열
 */
export const analyzeBatch = async (texts, language = 'ko', useDualModel = true) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/analyze/batch?language=${language}&use_dual_model=${useDualModel}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(texts)
      }
    )

    if (!response.ok) {
      throw new Error('대량 분석 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('Batch analysis failed:', error)
    throw error
  }
}


// ==================== 🆕 AI Writing Assistant API ====================

/**
 * 원본 텍스트 빠른 분석
 * @param {string} text - 분석할 텍스트
 * @param {string} language - 언어 코드
 * @returns {Promise<Object>} 감정/위험도 분석 결과
 */
export const assistantAnalyze = async (text, language = 'ko') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '분석 실패')
    }

    const data = await response.json()

    return {
      success: data.success,
      analysis: data.analysis,
      processingTime: data.processing_time_ms,
      modelUsed: data.model_used
    }
  } catch (error) {
    console.error('Assistant analyze failed:', error)
    throw error
  }
}

/**
 * 텍스트 개선 (3가지 버전 생성)
 * @param {string} text - 개선할 텍스트
 * @param {string} tone - 톤 (polite, neutral, friendly, formal, casual)
 * @param {string} language - 언어 코드
 * @param {string} instruction - 추가 지시사항 (선택)
 * @returns {Promise<Object>} AI 개선 결과
 */
export const assistantImprove = async (
  text,
  tone = 'polite',
  language = 'ko',
  instruction = null
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/improve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        tone,
        language,
        instruction
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '텍스트 개선 실패')
    }

    const data = await response.json()

    return {
      success: data.success,
      analysis: data.analysis,
      suggestions: data.suggestions,
      processingTime: data.processing_time_ms,
      modelUsed: data.model_used
    }
  } catch (error) {
    console.error('Assistant improve failed:', error)
    throw error
  }
}

/**
 * 댓글 답변 생성 (3가지 버전)
 * @param {string} originalComment - 원본 댓글
 * @param {string} context - 영상/게시글 맥락 (선택)
 * @param {string} replyType - 답변 유형 (constructive, grateful, apologetic, defensive)
 * @param {string} language - 언어 코드
 * @returns {Promise<Object>} AI 답변 생성 결과
 */
export const assistantReply = async (
  originalComment,
  context = null,
  replyType = 'constructive',
  language = 'ko'
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original_comment: originalComment,
        context,
        reply_type: replyType,
        language
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '답변 생성 실패')
    }

    const data = await response.json()

    return {
      success: data.success,
      analysis: data.analysis,
      suggestions: data.suggestions,
      processingTime: data.processing_time_ms,
      modelUsed: data.model_used
    }
  } catch (error) {
    console.error('Assistant reply failed:', error)
    throw error
  }
}

/**
 * 상황별 템플릿 생성 (3가지 버전)
 * @param {string} situation - 상황 (promotion, announcement, apology, explanation, feedback_request)
 * @param {string} topic - 주제/상황 설명 (선택)
 * @param {string} tone - 톤 (polite, neutral, friendly, formal, casual)
 * @param {string} language - 언어 코드
 * @returns {Promise<Object>} AI 템플릿 생성 결과
 */
export const assistantTemplate = async (
  situation,
  topic = null,
  tone = 'professional',
  language = 'ko'
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        situation,
        topic,
        tone,
        language
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '템플릿 생성 실패')
    }

    const data = await response.json()

    return {
      success: data.success,
      suggestions: data.suggestions,
      processingTime: data.processing_time_ms,
      modelUsed: data.model_used
    }
  } catch (error) {
    console.error('Assistant template failed:', error)
    throw error
  }
}


// ==================== 헬스 체크 & 정보 API ====================

/**
 * API 서버 상태 확인
 * @returns {Promise<Object>} 서버 상태
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)

    if (!response.ok) {
      throw new Error('서버 연결 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('Health check failed:', error)
    throw error
  }
}

/**
 * 모델 정보 조회
 * @returns {Promise<Object>} 모델 정보
 */
export const getModelsInfo = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/models/info`)

    if (!response.ok) {
      throw new Error('모델 정보 조회 실패')
    }

    return await response.json()
  } catch (error) {
    console.error('Get models info failed:', error)
    throw error
  }
}


// ==================== 유틸리티 함수 ====================

/**
 * 위험도 레벨을 색상으로 변환
 * @param {string} riskLevel - 위험도 (안전, 주의, 위험)
 * @returns {Object} Tailwind 색상 클래스
 */
export const getRiskLevelColor = (riskLevel) => {
  const colors = {
    '안전': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300'
    },
    '주의': {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300'
    },
    '위험': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300'
    }
  }

  return colors[riskLevel] || colors['안전']
}

/**
 * 감정 톤을 이모지로 변환
 * @param {string} emotionTone - 감정 톤 (긍정적, 중립적, 부정적)
 * @returns {string} 이모지
 */
export const getEmotionEmoji = (emotionTone) => {
  const emojis = {
    '긍정적': '😊',
    '중립적': '😐',
    '부정적': '😠'
  }

  return emojis[emotionTone] || '😐'
}

/**
 * 처리 시간을 사람이 읽기 쉬운 형태로 변환
 * @param {number} ms - 밀리초
 * @returns {string} 변환된 문자열
 */
export const formatProcessingTime = (ms) => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  } else {
    return `${(ms / 1000).toFixed(2)}s`
  }
}

/**
 * 신뢰도 점수를 퍼센트로 변환
 * @param {number} confidence - 신뢰도 (0.0 ~ 1.0)
 * @returns {string} 퍼센트 문자열
 */
export const formatConfidence = (confidence) => {
  return `${Math.round(confidence * 100)}%`
}


// ==================== Export ====================

export default {
  // 기존 API
  analyzeText,
  analyzeBatch,

  // AI Assistant API
  assistantAnalyze,
  assistantImprove,
  assistantReply,
  assistantTemplate,

  // 정보 API
  checkHealth,
  getModelsInfo,

  // 유틸리티
  getRiskLevelColor,
  getEmotionEmoji,
  formatProcessingTime,
  formatConfidence
}