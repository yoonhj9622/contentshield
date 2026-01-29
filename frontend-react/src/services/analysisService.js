// ==================== src/services/analysisService.js ====================

const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000'
const SPRING_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

// ==================== 🆕 SNS URL 분석 및 통계 (추가된 부분) ====================

/**
 * SNS URL을 입력받아 크롤링 및 분석 요청 (Spring Boot 연동)
 */
export const analyzeUrl = async (url, userId = 1) => {
  try {
    const response = await fetch(`${SPRING_API_URL}/comments/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, userId })
    });
    if (!response.ok) throw new Error('URL 분석 실패');
    return await response.json();
  } catch (error) {
    console.error('URL analysis failed:', error);
    throw error;
  }
}

/**
 * 대시보드용 통계 데이터 조회 (Spring Boot 연동)
 */
export const getStats = async (userId = 1) => {
  try {
    const response = await fetch(`${SPRING_API_URL}/comments/stats?userId=${userId}`);
    if (!response.ok) throw new Error('통계 데이터 로드 실패');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    throw error;
  }
}

// ==================== 기존 콘텐츠 분석 API (유지) ====================

export const analyzeText = async (text, language = 'ko', useDualModel = true) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language, use_dual_model: useDualModel })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '분석 실패');
    }
    return await response.json();
  } catch (error) {
    console.error('Text analysis failed:', error);
    throw error;
  }
}

export const analyzeBatch = async (texts, language = 'ko', useDualModel = true) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/batch?language=${language}&use_dual_model=${useDualModel}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(texts)
    });
    if (!response.ok) throw new Error('대량 분석 실패');
    return await response.json();
  } catch (error) {
    console.error('Batch analysis failed:', error);
    throw error;
  }
}

// ==================== AI Writing Assistant API (유지) ====================

export const assistantAnalyze = async (text, language = 'ko') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });
    if (!response.ok) throw new Error('Assistant 분석 실패');
    return await response.json();
  } catch (error) {
    console.error('Assistant analyze failed:', error);
    throw error;
  }
}

export const assistantImprove = async (text, tone = 'polite', language = 'ko', instruction = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tone, language, instruction })
    });
    if (!response.ok) throw new Error('텍스트 개선 실패');
    return await response.json();
  } catch (error) {
    console.error('Assistant improve failed:', error);
    throw error;
  }
}

export const assistantReply = async (originalComment, context = null, replyType = 'constructive', language = 'ko') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original_comment: originalComment, context, reply_type: replyType, language })
    });
    if (!response.ok) throw new Error('답변 생성 실패');
    return await response.json();
  } catch (error) {
    console.error('Assistant reply failed:', error);
    throw error;
  }
}

export const assistantTemplate = async (situation, topic, tone = 'polite', language = 'ko') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ situation, topic, tone, language })
    });
    if (!response.ok) throw new Error('템플릿 생성 실패');
    return await response.json();
  } catch (error) {
    console.error('Assistant template failed:', error);
    throw error;
  }
}

// ==================== 유틸리티 및 헬스체크 (유지) ====================

export const getRiskLevelColor = (riskLevel) => {
  const colors = {
    '안전': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    '주의': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    '위험': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  };
  return colors[riskLevel] || colors['안전'];
};

export const formatProcessingTime = (ms) => ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;

// ==================== Export ====================

// analysisService.js 맨 하단
export const analysisService = {
  analyzeUrl,
  getStats,
  analyzeText,
  analyzeBatch,
  assistantAnalyze,
  assistantImprove,
  assistantReply,
  assistantTemplate,
  getRiskLevelColor,
  formatProcessingTime
};

export default analysisService;