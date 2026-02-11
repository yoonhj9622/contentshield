"""
SNS Content Analyzer - Groq Dual Model Edition
Llama-Guard-4-12b (필터링) + Llama-3.1-8b-instant (분석)
+ AI Writing Assistant 기능 추가
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import logging
import os
from datetime import datetime
import httpx
import json
import re
import asyncio
from dotenv import load_dotenv
import pandas as pd
from io import StringIO
from rag_service import RAGService # ✨ RAG 서비스 추가
from langsmith import traceable # ✨ LangSmith Tracing 추가

# ✨ .env 파일 로드
load_dotenv()

# API 키 로드 확인
api_key_loaded = bool(os.getenv("GROQ_API_KEY"))
print(f"GROQ_API_KEY loaded: {api_key_loaded}")

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# RAG 서비스 초기화 (전역 변수 선언)
rag_service = None


# FastAPI 앱 생성
app = FastAPI(
    title="SNS Content Analyzer - Groq Dual Model + AI Assistant",
    description="Llama Guard 4 + Llama 3.1 듀얼 모델 악성 콘텐츠 탐지 + AI 작성 보조",
    version="3.1.0"
)

@app.on_event("startup")
async def startup_event():
    global rag_service
    try:
        # Text-to-SQL 모드 (Groq Llama 3.1 8b 사용 - 안정)
        rag_service = RAGService(model_name="llama-3.1-8b-instant", api_key=os.getenv("GROQ_API_KEY"))
        logger.info("✅ RAG Service (Text-to-SQL) initialized with Groq Llama 3.1 8b")
        # rag_service = None
        # logger.info("⚠️ RAG Service DISABLED due to startup crash")
    except Exception as e:
        logger.error(f"❌ Failed to initialize RAG Service: {e}")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    # 현재 (모든 도메인 허용 - 개발용)
    allow_origins=["*"],
    # 배포전
    #allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 기존 데이터 모델 ====================

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    language: str = Field(default="ko")
    use_dual_model: bool = Field(default=True, description="두 모델 모두 사용 여부")
    model_name: Optional[str] = Field(default=None, description="사용할 분석 모델 (예: llama-3.1-8b-instant, gemma2-9b-it)")
    custom_blocked_words: List[str] = Field(default=[], description="사용자 정의 차단 단어")  # 추가!

class AnalysisResponse(BaseModel):
    is_malicious: bool
    is_blocked: bool = False  # 추가! 사용자 차단 단어 포함 여부
    blocked_words_found: List[str] = []  # 추가! 발견된 사용자 차단 단어
    status: str = "clean"  # 추가! "clean", "malicious", "blocked"
    toxicity_score: float
    hate_speech_score: float
    profanity_score: float
    threat_score: float
    violence_score: float
    sexual_score: float
    confidence_score: float
    category: str
    detected_keywords: List[str]
    
    # Guard 모델 결과
    guard_result: Optional[Dict[str, Any]] = None
    guard_categories: List[str] = []
    
    # Llama 3.1 결과
    llama_reasoning: Optional[str] = None
    
    ai_model_version: str
    processing_time_ms: float
    analyzed_at: str


# ==================== 🆕 AI Assistant 데이터 모델 ====================

class AssistantAnalyzeRequest(BaseModel):
    """원본 텍스트 분석 요청"""
    text: str = Field(..., min_length=1, max_length=10000)
    language: str = Field(default="ko")


class AssistantImproveRequest(BaseModel):
    """텍스트 개선 요청"""
    text: str = Field(..., min_length=1, max_length=10000)
    tone: str = Field(default="polite", description="polite, neutral, friendly, formal, casual")
    language: str = Field(default="ko")
    instruction: Optional[str] = Field(default=None, description="추가 지시사항")


class AssistantReplyRequest(BaseModel):
    """댓글 답변 생성 요청"""
    original_comment: str = Field(..., min_length=1, max_length=1000)
    context: Optional[str] = Field(default=None, description="영상/게시글 내용")
    reply_type: str = Field(default="constructive", description="constructive, grateful, apologetic, defensive")
    language: str = Field(default="ko")


class AssistantTemplateRequest(BaseModel):
    """상황별 템플릿 생성 요청"""
    situation: str = Field(..., description="promotion, announcement, apology, explanation, feedback_request")
    topic: Optional[str] = Field(default=None, description="주제/상황 설명")
    tone: str = Field(default="professional")
    language: str = Field(default="ko")


class QuickAnalysis(BaseModel):
    """간단 분석 결과"""
    emotion_tone: str  # "긍정적", "중립적", "부정적"
    risk_level: str    # "안전", "주의", "위험"
    has_profanity: bool
    has_aggression: bool
    misunderstanding_risk: str  # "없음", "낮음", "있음", "높음"


# ==================== 🆕 RAG Types ====================

class RAGLoadRequest(BaseModel):
    directory_path: str = Field(..., description="문서가 있는 디렉토리 경로 (예: docs)")

class RAGChatRequest(BaseModel):
    question: str = Field(..., description="질문 내용")



class SuggestionOption(BaseModel):
    """AI 제안 옵션"""
    version: Union[int, str]
    text: str
    tone: str
    reasoning: str
    confidence: float


class AssistantResponse(BaseModel):
    """AI Assistant 통합 응답"""
    success: bool
    analysis: Optional[QuickAnalysis] = None
    suggestions: List[SuggestionOption] = []
    processing_time_ms: float
    model_used: str


# ==================== 기존 Groq Dual Model Analyzer (유지) ====================

class GroqDualModelAnalyzer:
    """Llama Guard 4 + Llama 3.1 듀얼 모델 분석 서비스"""
    
    def __init__(self):
        self.model_version = "groq-dual-llama-guard4-llama3.1"
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        
        if not self.api_key:
            logger.warning("⚠️ GROQ_API_KEY not set")
            logger.warning("  Get FREE API key: https://console.groq.com/keys")
        else:
            logger.info("✓ Groq API key configured")
        
        # 모델 설정
        self.models = {
            "guard": "llama-guard-3-8b",
            "analysis": "llama-3.1-8b-instant"
        }
        
        # Guard 카테고리 매핑
        self.guard_categories = {
            "S1": "violent_crimes",
            "S2": "non_violent_crimes",
            "S3": "sex_related_crimes",
            "S4": "child_exploitation",
            "S5": "defamation",
            "S6": "specialized_advice",
            "S7": "privacy",
            "S8": "intellectual_property",
            "S9": "indiscriminate_weapons",
            "S10": "hate",
            "S11": "self_harm",
            "S12": "sexual_content",
            "S13": "elections"
        }
        
        # 규칙 기반 차단 단어
        self.blocked_words = {
            "ko": [
                "바보", "멍청이", "병신", "개새끼", "씨발", "지랄", "미친",
                "죽여", "죽일", "때려", "혐오", "차별", "꺼져", "닥쳐","개자식","양아치"
            ],
            "en": [
                "stupid", "idiot", "fuck", "shit", "kill", "hate", "damn"
            ]
        }
        
        logger.info("Groq Dual Model Analyzer initialized")
        logger.info(f"  - Guard Model: {self.models['guard']}")
        logger.info(f"  - Analysis Model: {self.models['analysis']}")



    
    @traceable(run_type="chain", name="Dual Model Analysis")
    async def analyze_text(
        self, 
        text: str, 
        language: str = "ko",
        use_dual_model: bool = True,
        model_name: Optional[str] = None, # ✨ 추가
        custom_blocked_words: List[str] = None
    ) -> AnalysisResponse:
        """텍스트 분석 (듀얼 모델)"""
        import time
        # 모델 선택
        analysis_model = model_name if model_name else self.models["analysis"]
        start_time = time.time()
        
        try:
            # 1. 규칙 기반 필터링 (사용자 차단 단어 포함)
            rule_result = self._rule_based_filter(text, language, custom_blocked_words or [])
            
            if not self.api_key:
                logger.warning("No API key, using fallback")
                result = self._create_fallback_response(text, rule_result)
            elif use_dual_model:
                # 2. 듀얼 모델 분석
                result = await self._dual_model_analysis(text, language, rule_result, analysis_model)
            else:
                # 3. 단일 모델 분석
                result = await self._single_model_analysis(text, language, rule_result, analysis_model)
            
            # 사용자 차단 단어 처리 추가
            result["is_blocked"] = rule_result.get("is_blocked_by_user", False)
            result["blocked_words_found"] = rule_result.get("user_blocked_words_found", [])
            
            # status 결정
            if result["is_blocked"]:
                result["status"] = "blocked"
            elif result["is_malicious"]:
                result["status"] = "malicious"
            else:
                result["status"] = "clean"
            
            processing_time = (time.time() - start_time) * 1000
            result["processing_time_ms"] = round(processing_time, 2)
            result["analyzed_at"] = datetime.now().isoformat()
            result["ai_model_version"] = self.model_version
            
            return AnalysisResponse(**result)
        
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    async def _dual_model_analysis(
        self, 
        text: str, 
        language: str,
        rule_result: Dict,
        analysis_model: str # Added analysis_model parameter
    ) -> Dict[str, Any]:
        """듀얼 모델 분석 (Guard + Llama 3.1 병렬 실행)"""
        try:
            guard_task = self._llama_guard_check(text, language)
            llama_task = self._llama_analysis(text, language, model=analysis_model) # Pass model here
            
            guard_result, llama_result = await asyncio.gather(
                guard_task,
                llama_task,
                return_exceptions=True
            )
            
            if isinstance(guard_result, Exception):
                logger.error(f"Guard model failed: {guard_result}")
                guard_result = self._fallback_guard_result()
            
            if isinstance(llama_result, Exception):
                logger.error(f"Llama model failed: {llama_result}")
                llama_result = self._fallback_analysis(text)
            
            combined = self._combine_dual_results(
                rule_result,
                guard_result,
                llama_result
            )
            
            return combined
            
        except Exception as e:
            logger.error(f"Dual model analysis failed: {e}")
            return self._create_fallback_response(text, rule_result)
    
    async def _llama_guard_check(self, text: str, language: str) -> Dict[str, Any]:
        """Llama Guard 4 안전성 검사"""
        try:
            prompt = f"""[INST] Task: Check if there is unsafe content in 'User' messages in conversations according our safety policy with the below categories.

<BEGIN UNSAFE CONTENT CATEGORIES>
S1: Violent Crimes
S2: Non-Violent Crimes
S3: Sex-Related Crimes
S4: Child Sexual Exploitation
S5: Defamation
S6: Specialized Advice
S7: Privacy
S8: Intellectual Property
S9: Indiscriminate Weapons
S10: Hate
S11: Self-Harm
S12: Sexual Content
S13: Elections
<END UNSAFE CONTENT CATEGORIES>

<BEGIN CONVERSATION>
User: {text}
<END CONVERSATION>

Provide your safety assessment for User's message:
- First line must be 'safe' or 'unsafe'
- If unsafe, list all violated categories (S1, S2, etc.) [/INST]"""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.models["guard"],
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.0,
                        "max_tokens": 100
                    }
                )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                
                is_safe = content.lower().startswith("safe")
                violated_categories = []
                
                if not is_safe:
                    categories = re.findall(r'S\d+', content)
                    violated_categories = [
                        self.guard_categories.get(cat, cat) 
                        for cat in categories
                    ]
                
                logger.info(f"Guard result: {'safe' if is_safe else 'unsafe'}, categories: {violated_categories}")
                
                return {
                    "is_safe": is_safe,
                    "violated_categories": violated_categories,
                    "raw_response": content,
                    "guard_success": True
                }
            else:
                logger.error(f"Guard API error: {response.status_code}")
                return self._fallback_guard_result()
                
        except Exception as e:
            logger.error(f"Guard check failed: {e}")
            return self._fallback_guard_result()
    
    @traceable(run_type="llm", name="Groq Llama Analysis")
    async def _llama_analysis(self, text: str, language: str, model: str = None) -> Dict[str, Any]:
        """Llama 3.1 분석 (상세 점수 + 추론)"""
        try:
            # 모델 선택
            target_model = model if model else self.models["analysis"]
            
            # 언어 감지 (파라미터가 없거나 불확실할 때)
            lang = language
            if not lang or lang not in ("ko", "en"):
                if re.search(r"[가-힣]", text):
                    lang = "ko"
                else:
                    lang = "en"
            
            if lang == "ko":
                system_prompt = """You are an expert in analyzing toxic and harmful content.
Analyze the given text and provide detailed scores (0-100) for each category.

Respond in valid JSON format only, no markdown:
{
  "toxicity_score": <0-100>,
  "hate_speech_score": <0-100>,
  "profanity_score": <0-100>,
  "threat_score": <0-100>,
  "violence_score": <0-100>,
  "sexual_score": <0-100>,
  "key_phrases": ["<phrase1>", "<phrase2>"],
  "reasoning": "<항목 이름(예: '혐오표현 점수', '욕설 점수' 등)을 반드시 한글로 사용하여 분석 결과를 한국어로 설명하세요.>"
}"""
                user_prompt = f'다음 텍스트의 유해성을 분석하고, 문제가 되는 핵심 문구나 단어를 key_phrases에 배열로 추출해주세요: "{text}"'
            else:
                system_prompt = """You are an expert in analyzing toxic and harmful content.
Analyze the given text and provide detailed scores (0-100) for each category.

Respond in valid JSON format only, no markdown:
{
  "toxicity_score": <0-100>,
  "hate_speech_score": <0-100>,
  "profanity_score": <0-100>,
  "threat_score": <0-100>,
  "violence_score": <0-100>,
  "sexual_score": <0-100>,
  "key_phrases": ["<phrase1>", "<phrase2>"],
  "reasoning": "<brief explanation in English>"
}"""
                user_prompt = f'Analyze this text for harmful content and extract problematic key phrases into key_phrases: "{text}"'
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": target_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 300
                    }
                )
            
            if response.status_code == 200:
                # [Rate Limit Logging]
                remaining_tokens = response.headers.get("x-ratelimit-remaining-tokens", "unknown")
                remaining_requests = response.headers.get("x-ratelimit-remaining-requests", "unknown")
                logger.info(f"⚡ Groq Rate Limit Info: Remaining Tokens={remaining_tokens}, Requests={remaining_requests}")

                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                json_result = self._extract_json(content)
                
                if json_result:
                    logger.info(f"Llama analysis: toxicity={json_result.get('toxicity_score', 0)}")
                    
                    return {
                        "toxicity_score": json_result.get("toxicity_score", 0),
                        "hate_speech_score": json_result.get("hate_speech_score", 0),
                        "profanity_score": json_result.get("profanity_score", 0),
                        "threat_score": json_result.get("threat_score", 0),
                        "violence_score": json_result.get("violence_score", 0),
                        "sexual_score": json_result.get("sexual_score", 0),
                        "key_phrases": json_result.get("key_phrases", []),
                        "reasoning": json_result.get("reasoning", ""),
                        "llama_success": True
                    }
                else:
                    logger.warning("Failed to parse Llama response")
                    return self._fallback_analysis(text)
            else:
                logger.error(f"Llama API error: {response.status_code}")
                return self._fallback_analysis(text)
                
        except Exception as e:
            logger.error(f"Llama analysis failed: {e}")
            return self._fallback_analysis(text)
    
    async def _single_model_analysis(
        self,
        text: str,
        language: str,
        rule_result: Dict,
        analysis_model: str = None
    ) -> Dict[str, Any]:
        """단일 모델 분석 (Llama 3.1만 사용)"""
        llama_result = await self._llama_analysis(text, language, model=analysis_model)
        return self._combine_results(rule_result, llama_result)
    
    def _rule_based_filter(self, text: str, language: str, custom_blocked_words: List[str] = None) -> Dict[str, Any]:
        """규칙 기반 필터링 (사용자 차단 단어 포함)"""
        detected = []
        user_blocked_found = []
        score = 0.0
        
        # 기본 차단 단어 체크
        words = self.blocked_words.get(language, [])
        text_lower = text.lower()
        
        for word in words:
            if word in text_lower:
                detected.append(word)
                score += 25.0
        
        # 사용자 정의 차단 단어 체크
        if custom_blocked_words:
            for word in custom_blocked_words:
                if word.lower() in text_lower:
                    user_blocked_found.append(word)
                    # 사용자 차단 단어는 별도로 처리 (점수에 추가하지 않음)
        
        return {
            "detected_keywords": detected,
            "rule_score": min(score, 100.0),
            "is_malicious_rule": score > 50.0,
            "is_blocked_by_user": len(user_blocked_found) > 0,  # 추가!
            "user_blocked_words_found": user_blocked_found  # 추가!
        }
    
    def _combine_dual_results(
        self,
        rule_result: Dict,
        guard_result: Dict,
        llama_result: Dict
    ) -> Dict[str, Any]:
        """듀얼 모델 결과 통합"""
        
        guard_boost = 0
        if not guard_result.get("is_safe", True):
            guard_boost = 30
        
        weight_rule = 0.15
        weight_guard = 0.35
        weight_llama = 0.50
        
        toxicity = (
            rule_result["rule_score"] * weight_rule +
            guard_boost * weight_guard +
            llama_result.get("toxicity_score", 0) * weight_llama
        )
        
        hate_speech = llama_result.get("hate_speech_score", 0)
        profanity = llama_result.get("profanity_score", 0)
        threat = llama_result.get("threat_score", 0)
        violence = llama_result.get("violence_score", 0)
        sexual = llama_result.get("sexual_score", 0)
        
        violated_cats = guard_result.get("violated_categories", [])
        if "hate" in violated_cats:
            hate_speech = max(hate_speech, 80)
        if "violent_crimes" in violated_cats:
            violence = max(violence, 85)
        if "sexual_content" in violated_cats:
            sexual = max(sexual, 85)
        
        # 1. 악성 판정 기준 (is_malicious) 수정
        # 너무 민감한 '0점 초과' 정책을 15점으로 현실화하고, 
        # 각 항목별 최소 기준 중 하나만 넘어도 악성으로 간주합니다.
        is_malicious = (
            toxicity > 15 or 
            hate_speech > 15 or 
            profanity > 20 or 
            threat > 20 or 
            violence > 20 or 
            sexual > 20 or 
            not guard_result.get("is_safe", True) or 
            rule_result["is_malicious_rule"]
        )

        # 2. 카테고리 결정 로직 (가장 핵심적인 수정)
        # 고정된 높은 임계값(60, 35 등)을 사용하기 전에, 
        # 점수가 가장 높은 항목이 무엇인지 먼저 찾습니다.
        scores = {
            "violence": violence,
            "sexual_content": sexual,
            "threat": threat,
            "hate_speech": hate_speech,
            "profanity": profanity
        }
        max_cat = max(scores, key=scores.get)
        max_score = scores[max_cat]

        category = "safe" # 기본값

        if is_malicious:
            # 최고 점수 항목이 15점만 넘어도 해당 카테고리로 명명 (20점 혐오표현 해결)
            if max_score > 15:
                category = max_cat
            # 만약 개별 점수들은 낮은데 전체 독성(toxicity)만 높은 경우
            elif toxicity > 70:
                category = "highly_toxic"
            else:
                category = "moderately_toxic"
        else:
            category = "safe"

        confidence = 95.0 if guard_result.get("guard_success") and llama_result.get("llama_success") else 70.0
        
        # Merge detected keywords (Rules + AI)
        ai_keywords = llama_result.get("key_phrases", [])
        combined_keywords = list(set(rule_result["detected_keywords"] + ai_keywords))
        
        return {
            "is_malicious": is_malicious,
            "toxicity_score": round(toxicity, 2),
            "hate_speech_score": round(hate_speech, 2),
            "profanity_score": round(profanity, 2),
            "threat_score": round(threat, 2),
            "violence_score": round(violence, 2),
            "sexual_score": round(sexual, 2),
            "confidence_score": round(confidence, 2),
            "category": category,
            "detected_keywords": combined_keywords,
            "guard_result": {
                "is_safe": guard_result.get("is_safe", True),
                "violated_categories": violated_cats
            },
            "guard_categories": violated_cats,
            "llama_reasoning": llama_result.get("reasoning", "")
        }
    
    def _combine_results(self, rule_result: Dict, llama_result: Dict) -> Dict[str, Any]:
        """단일 모델 결과 통합 (Llama 3.1만)"""
        weight_rule = 0.3
        weight_llama = 0.7
        
        toxicity = (
            rule_result["rule_score"] * weight_rule +
            llama_result.get("toxicity_score", 0) * weight_llama
        )
        
        return {
            "is_malicious": toxicity > 50 or rule_result["is_malicious_rule"],
            "toxicity_score": round(toxicity, 2),
            "hate_speech_score": round(llama_result.get("hate_speech_score", 0), 2),
            "profanity_score": round(llama_result.get("profanity_score", 0), 2),
            "threat_score": round(llama_result.get("threat_score", 0), 2),
            "violence_score": round(llama_result.get("violence_score", 0), 2),
            "sexual_score": round(llama_result.get("sexual_score", 0), 2),
            "violence_score": round(llama_result.get("violence_score", 0), 2),
            "sexual_score": round(llama_result.get("sexual_score", 0), 2),
            "confidence_score": 85.0,
            "category": "toxic" if toxicity > 50 else "safe",
            "detected_keywords": list(set(rule_result["detected_keywords"] + llama_result.get("key_phrases", []))),
            "guard_result": None,
            "guard_categories": [],
            "llama_reasoning": llama_result.get("reasoning", "")
        }
    
    def _fallback_guard_result(self) -> Dict[str, Any]:
        """Guard 폴백"""
        return {
            "is_safe": True,
            "violated_categories": [],
            "raw_response": "Guard unavailable",
            "guard_success": False
        }
    
    def _fallback_analysis(self, text: str) -> Dict[str, Any]:
        """Llama 폴백"""
        # API 오류 시 '안전'으로 처리 (길이 기반 판정 제거)
        return {
            "toxicity_score": 0,
            "hate_speech_score": 0,
            "profanity_score": 0,
            "threat_score": 0,
            "violence_score": 0,
            "sexual_score": 0,
            "reasoning": "Fallback analysis (API Unavailable) - Assumed Safe",
            "llama_success": False
        }
    
    def _create_fallback_response(self, text: str, rule_result: Dict) -> Dict[str, Any]:
        """완전 폴백"""
        score = rule_result["rule_score"]
        
        return {
            "is_malicious": rule_result["is_malicious_rule"],
            "toxicity_score": score,
            "hate_speech_score": max(0, score - 20),
            "profanity_score": max(0, score - 10),
            "threat_score": max(0, score - 30),
            "violence_score": max(0, score - 25),
            "sexual_score": max(0, score - 35),
            "confidence_score": 40.0,
            "category": "toxic" if score > 50 else "safe",
            "detected_keywords": rule_result["detected_keywords"],
            "guard_result": None,
            "guard_categories": [],
            "llama_reasoning": "Fallback: Rule-based only"
        }
    
    def _extract_json(self, text: str) -> Optional[Dict]:
        """JSON 추출 (Groq 응답 전용)"""
        try:
            # 1. Markdown 코드 블록 제거
            text = re.sub(r'```json\s*', '', text)
            text = re.sub(r'\s*```', '', text)
            text = text.strip()

            # 2. 직접 파싱 시도
            try:
                result = json.loads(text)
                logger.info(f"✅ JSON 직접 파싱 성공: {len(result.get('suggestions', []))}개 제안")
                return result
            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ 직접 파싱 실패: {e}")
        
            # 3. 가장 큰 JSON 객체 찾기 (중첩 구조 지원)
            max_json = None
            max_length = 0
        
            # 모든 { 위치 찾기
            for i in range(len(text)):
                if text[i] == '{':
                    # 이 위치에서 시작하는 완전한 JSON 찾기
                    depth = 0
                    for j in range(i, len(text)):
                        if text[j] == '{':
                            depth += 1
                        elif text[j] == '}':
                            depth -= 1
                            if depth == 0:
                                # 완전한 JSON 발견
                                json_str = text[i:j+1]
                                try:
                                    parsed = json.loads(json_str)
                                    if len(json_str) > max_length:
                                        max_json = parsed
                                        max_length = len(json_str)
                                except:
                                    pass
                                break
        
            if max_json:
                logger.info(f"✅ 중괄호 매칭으로 파싱 성공: {len(max_json.get('suggestions', []))}개 제안")
                return max_json
        
            logger.error(f"❌ JSON 파싱 실패 - 전체 텍스트 길이: {len(text)}")
            logger.error(f"❌ 텍스트 시작 부분: {text[:500]}")
            return None
        
        except Exception as e:
            logger.error(f"❌ JSON 파싱 예외: {e}")
            return None

#소영님
# ==================== 🆕 AI Writing Assistant Service ====================

class AIWritingAssistant:
    """AI 작성 보조 서비스 (Llama 3.1 기반)"""
    
    def __init__(self, analyzer: GroqDualModelAnalyzer):
        self.analyzer = analyzer
        self.api_key = analyzer.api_key
        self.base_url = analyzer.base_url
        self.model = analyzer.models["analysis"]  # Llama-3.1-8b-instant
        
        # 톤 앤 매너 한국어 매핑
        self.tone_mapping = {
            "polite": "공손하고 정중한",
            "neutral": "중립적이고 객관적인",
            "friendly": "친근하고 따뜻한",
            "formal": "격식있고 전문적인",
            "casual": "편안하고 자연스러운"
        }

        # 상황별 프롬프트 템플릿
        self.situation_templates = {
            "promotion": "홍보/마케팅 게시글",
            "announcement": "팬 공지/안내 메시지",
            "apology": "사과 및 해명",
            "explanation": "상황 설명",
            "feedback_request": "건설적 피드백 요청"
        }

        # 장소영~여기까지: 영어 출력 지원을 위한 EN 매핑/언어감지 유틸 추가
        self.tone_mapping_en = {
            "polite": "polite and respectful",
            "neutral": "neutral and objective",
            "friendly": "friendly and warm",
            "formal": "formal and professional",
            "casual": "casual and natural"
        }

        self.situation_templates_en = {
            "promotion": "a promotional/marketing post",
            "announcement": "an announcement / community notice",
            "apology": "an apology / clarification",
            "explanation": "an explanation",
            "feedback_request": "a constructive feedback request"
        }

        def _detect_language_simple(text: str) -> str:
            if not text:
                return "en"
            if re.search(r"[가-힣]", text):
                return "ko"
            return "en"

        self._detect_language_simple = _detect_language_simple
        # 장소영~여기까지
        
        logger.info("AI Writing Assistant initialized")

    # 장소영~여기까지: language 파라미터가 ko/en이 아니거나 누락되면 입력 텍스트로 자동 감지
    def _resolve_language(self, text: str, language: str = "ko") -> str:
        lang = (language or "").strip().lower()
        if lang not in ("ko", "en"):
            lang = self._detect_language_simple(text)
        return lang
    # 장소영~여기까지
    
    async def quick_analyze(
        self, 
        text: str, 
        language: str = "ko"
    ) -> QuickAnalysis:
        """빠른 감정/위험도 분석"""
        try:
            # 장소영~여기까지: quick_analyze도 입력 기반 언어 자동 보정
            language = self._resolve_language(text, language)
            # 장소영~여기까지

            # 기존 analyzer 활용 (Guard + Llama 3.1)
            analysis_result = await self.analyzer.analyze_text(text, language, use_dual_model=True)
            
            # 감정 톤 판별
            if analysis_result.toxicity_score > 60:
                emotion_tone = "부정적" if language == "ko" else "Negative"
            elif analysis_result.toxicity_score < 30:
                emotion_tone = "긍정적" if language == "ko" else "Positive"
            else:
                emotion_tone = "중립적" if language == "ko" else "Neutral"
            
            # 위험도 판별
            if analysis_result.is_malicious or analysis_result.toxicity_score > 70:
                risk_level = "위험" if language == "ko" else "High"
            elif analysis_result.toxicity_score > 40:
                risk_level = "주의" if language == "ko" else "Medium"
            else:
                risk_level = "안전" if language == "ko" else "Low"
            
            # 오해 가능성 판별
            if analysis_result.toxicity_score > 50:
                misunderstanding_risk = "높음" if language == "ko" else "High"
            elif analysis_result.toxicity_score > 30:
                misunderstanding_risk = "있음" if language == "ko" else "Some"
            elif analysis_result.toxicity_score > 15:
                misunderstanding_risk = "낮음" if language == "ko" else "Low"
            else:
                misunderstanding_risk = "없음" if language == "ko" else "None"
            
            return QuickAnalysis(
                emotion_tone=emotion_tone,
                risk_level=risk_level,
                has_profanity=analysis_result.profanity_score > 60,
                has_aggression=analysis_result.threat_score > 50 or analysis_result.violence_score > 50,
                misunderstanding_risk=misunderstanding_risk
            )
            
        except Exception as e:
            logger.error(f"Quick analysis failed: {e}")
            # 폴백
            return QuickAnalysis(
                emotion_tone="중립적",
                risk_level="안전",
                has_profanity=False,
                has_aggression=False,
                misunderstanding_risk="없음"
            )
    
    async def improve_text(
        self,
        text: str,
        tone: str = "polite",
        language: str = "ko",
        instruction: Optional[str] = None
    ) -> List[SuggestionOption]:
        """텍스트 개선 (3가지 버전 생성)"""
        try:
            logger.info(f"🔄 Starting text improvement: text='{text[:30]}...', tone={tone}")

            # 장소영~여기까지: 입력 기반 언어 자동 감지 + 프롬프트를 ko/en로 분기
            language = self._resolve_language(text, language)

            if language == "ko":
                tone_label = self.tone_mapping.get(tone, "공손하고 정중한")

                system_prompt = f"""당신은 전문 콘텐츠 에디터입니다. 
사용자의 텍스트를 {tone_label} 톤으로 개선하여 3가지 다른 버전을 제안하세요.

요구사항:
1. 원문의 핵심 의미는 유지
2. 오해의 소지가 없도록 명확하게 표현
3. 욕설, 공격적 표현 제거
4. 3가지 버전은 각각 다른 강도/스타일로 작성
5. 유튜브 댓글/커뮤니티 게시글에 적합한 길이 (2-5줄)

응답 형식 (JSON만):
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "개선된 텍스트 버전 1 (가장 공손함)",
      "tone": "매우 공손",
      "reasoning": "개선 이유 설명",
      "confidence": 0.95
    }},
    {{
      "version": 2,
      "text": "개선된 텍스트 버전 2 (중간)",
      "tone": "중립적",
      "reasoning": "개선 이유 설명",
      "confidence": 0.90
    }},
    {{
      "version": 3,
      "text": "개선된 텍스트 버전 3 (친근함)",
      "tone": "친근함",
      "reasoning": "개선 이유 설명",
      "confidence": 0.88
    }}
  ]
}}"""

                user_prompt = f"""원본 텍스트: "{text}"
{'추가 지시사항: ' + instruction if instruction else ''}

위 텍스트를 {tone_label} 톤으로 3가지 버전으로 개선해주세요."""
            else:
                tone_label = self.tone_mapping_en.get(tone, "polite and respectful")

                system_prompt = f"""You are a professional content editor.
Rewrite the user's text in a {tone_label} tone and propose 3 distinct versions.

Requirements:
1. Keep the original meaning
2. Make it clear and reduce misunderstanding
3. Remove profanity, insults, and aggressive wording
4. Each version should differ in style/intensity
5. Suitable length for YouTube comments/community posts (2-5 lines)

Return JSON ONLY (no markdown, no extra text):
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "Improved version 1 (most polite)",
      "tone": "Very polite",
      "reasoning": "Why this is better",
      "confidence": 0.95
    }},
    {{
      "version": 2,
      "text": "Improved version 2 (neutral)",
      "tone": "Neutral",
      "reasoning": "Why this is better",
      "confidence": 0.90
    }},
    {{
      "version": 3,
      "text": "Improved version 3 (friendly)",
      "tone": "Friendly",
      "reasoning": "Why this is better",
      "confidence": 0.88
    }}
  ]
}}"""

                user_prompt = f"""Original text: "{text}"
{('Additional instruction: ' + instruction) if instruction else ''}

Please rewrite the text into 3 versions in a {tone_label} tone."""
            # 장소영~여기까지

            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"📤 Sending request to Groq API...")
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 1500
                    }
                )
                logger.info(f"📥 Groq API response: status={response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                logger.info(f"📝 Groq response length: {len(content)} characters")
                
                json_result = self.analyzer._extract_json(content)
                
                if json_result and "suggestions" in json_result:
                    suggestions = []
                    for item in json_result["suggestions"]:
                        # 텍스트는 원본 그대로 (톤 정보 제거)
                        text_val = item.get("text", "")
                        
                        # 버전에 톤 정보 추가 (사용자 요청)
                        tone_val = item.get("tone", "")
                        version_val = item.get("version", 1)
                        if tone_val:
                            version_val = f"{version_val} ({tone_val})"

                        suggestions.append(SuggestionOption(
                            version=version_val,
                            text=text_val,
                            tone=item.get("tone", tone),
                            reasoning=item.get("reasoning", ""),
                            confidence=item.get("confidence", 0.85)
                        ))
                    logger.info(f"Generated {len(suggestions)} improved versions")
                    return suggestions
                else:
                    logger.warning("Failed to parse improvement response")
                    return self._fallback_improvement(text, tone)
            else:
                logger.error(f"Improvement API error: {response.status_code}")
                return self._fallback_improvement(text, tone)
                
        except Exception as e:
            logger.error(f"Text improvement failed: {e}")
            return self._fallback_improvement(text, tone)
    
    async def generate_reply(
        self,
        original_comment: str,
        context: Optional[str] = None,
        reply_type: str = "constructive",
        language: str = "ko"
    ) -> List[SuggestionOption]:
        """댓글 답변 생성 (3가지 버전)"""
        try:
            # 장소영~여기까지: 입력 기반 언어 자동 감지 + 프롬프트 ko/en 분기
            language = self._resolve_language(original_comment, language)

            if language == "ko":
                reply_types_ko = {
                    "constructive": "건설적이고 발전적인",
                    "grateful": "감사하고 겸손한",
                    "apologetic": "사과하고 해명하는",
                    "defensive": "방어적이지만 예의있는"
                }
                reply_tone = reply_types_ko.get(reply_type, "건설적이고 발전적인")

                system_prompt = f"""당신은 유튜브 크리에이터의 커뮤니티 매니저입니다.
악성 댓글이나 비판적 댓글에 대해 {reply_tone} 답변을 3가지 버전으로 생성하세요.

원칙:
1. 절대 욕설이나 공격적 표현 사용 금지
2. 팬들과의 관계 유지를 최우선으로
3. 법적 리스크가 있는 표현 회피
4. 브랜드 이미지 보호
5. 각 버전은 다른 강도/접근법 사용

응답 형식 (JSON만):
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "답변 버전 1 (가장 공손하고 겸손)",
      "tone": "매우 공손",
      "reasoning": "이 답변을 선택한 이유",
      "confidence": 0.92
    }},
    {{
      "version": 2,
      "text": "답변 버전 2 (중립적)",
      "tone": "중립적",
      "reasoning": "이 답변을 선택한 이유",
      "confidence": 0.88
    }},
    {{
      "version": 3,
      "text": "답변 버전 3 (단호하지만 예의있음)",
      "tone": "단호하지만 예의있음",
      "reasoning": "이 답변을 선택한 이유",
      "confidence": 0.85
    }}
  ]
}}"""

                context_text = f"\n영상/게시글 내용: {context}" if context else ""
                user_prompt = f"""원본 댓글: "{original_comment}"{context_text}

위 댓글에 대한 {reply_tone} 답변을 3가지 버전으로 생성해주세요."""
            else:
                reply_types_en = {
                    "constructive": "constructive and solution-oriented",
                    "grateful": "grateful and humble",
                    "apologetic": "apologetic and clarifying",
                    "defensive": "firm but polite"
                }
                reply_tone = reply_types_en.get(reply_type, "constructive and solution-oriented")

                system_prompt = f"""You are a community manager for a YouTube creator.
Generate 3 reply options to a critical/negative comment in a {reply_tone} style.

Rules:
1. Never use profanity or insults
2. Prioritize maintaining a healthy relationship with viewers
3. Avoid legal-risky statements
4. Protect brand image
5. Each version should differ in approach/intensity

Return JSON ONLY (no markdown, no extra text):
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "Reply version 1 (most polite)",
      "tone": "Very polite",
      "reasoning": "Why this reply works",
      "confidence": 0.92
    }},
    {{
      "version": 2,
      "text": "Reply version 2 (neutral)",
      "tone": "Neutral",
      "reasoning": "Why this reply works",
      "confidence": 0.88
    }},
    {{
      "version": 3,
      "text": "Reply version 3 (firm but polite)",
      "tone": "Firm but polite",
      "reasoning": "Why this reply works",
      "confidence": 0.85
    }}
  ]
}}"""

                context_text = f"\nContext (video/post): {context}" if context else ""
                user_prompt = f"""Original comment: "{original_comment}"{context_text}

Please generate 3 reply options in a {reply_tone} style."""
            # 장소영~여기까지

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 1500
                    }
                )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                logger.info(f"📝 Groq response length: {len(content)} characters")
                
                json_result = self.analyzer._extract_json(content)
                
                if json_result and "suggestions" in json_result:
                    suggestions = []
                    for item in json_result["suggestions"]:
                        tone_val = item.get("tone", reply_type)
                        version_val = item.get("version", 1)
                        if tone_val:
                            version_val = f"{version_val} ({tone_val})"

                        suggestions.append(SuggestionOption(
                            version=version_val,
                            text=item.get("text", ""),
                            tone=tone_val,
                            reasoning=item.get("reasoning", ""),
                            confidence=item.get("confidence", 0.85)
                        ))
                    
                    logger.info(f"Generated {len(suggestions)} reply versions")
                    return suggestions
                else:
                    logger.warning("Failed to parse reply response")
                    return self._fallback_reply(original_comment, reply_type)
            else:
                logger.error(f"Reply API error: {response.status_code}")
                return self._fallback_reply(original_comment, reply_type)
                
        except Exception as e:
            logger.error(f"Reply generation failed: {e}")
            return self._fallback_reply(original_comment, reply_type)
    
    async def generate_template(
        self,
        situation: str,
        topic: Optional[str] = None,
        tone: str = "professional",
        language: str = "ko"
    ) -> List[SuggestionOption]:
        """상황별 템플릿 생성 (3가지 버전)"""
        try:
            # 장소영~여기까지: topic/상황 텍스트로도 언어 감지(한국어 주제면 한국어로)
            sample_text = (topic or "") + " " + (situation or "")
            language = self._resolve_language(sample_text, language)

            if language == "ko":
                situation_ko = self.situation_templates.get(situation, "일반 게시글")
                tone_ko = self.tone_mapping.get(tone, "전문적인")
                
                system_prompt = f"""당신은 소셜 미디어 콘텐츠 전문가입니다.
"{situation_ko}" 상황에 맞는 게시글/댓글 템플릿을 {tone_ko} 톤으로 3가지 버전 생성하세요.

요구사항:
1. 유튜브 커뮤니티 게시글 또는 댓글로 적합
2. 3-7줄 길이 (너무 길지 않게)
3. 이모지 사용 가능 (적절히)
4. 각 버전은 다른 접근법/길이 사용
5. 법적 리스크 없는 안전한 표현

응답 형식 (JSON만):
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "템플릿 버전 1 (간결하고 핵심적)",
      "tone": "간결",
      "reasoning": "이 템플릿의 특징",
      "confidence": 0.90
    }},
    {{
      "version": 2,
      "text": "템플릿 버전 2 (중간 길이, 감정 표현)",
      "tone": "감정적",
      "reasoning": "이 템플릿의 특징",
      "confidence": 0.88
    }},
    {{
      "version": 3,
      "text": "템플릿 버전 3 (상세하고 전문적)",
      "tone": "전문적",
      "reasoning": "이 템플릿의 특징",
      "confidence": 0.85
    }}
  ]
}}"""

                topic_text = f"\n주제/상황: {topic}" if topic else ""
                user_prompt = f"""상황: {situation_ko}{topic_text}

위 상황에 맞는 {tone_ko} 톤의 템플릿을 3가지 버전으로 생성해주세요."""
            else:
                situation_en = self.situation_templates_en.get(situation, "a general post")
                tone_en = self.tone_mapping_en.get(tone, "professional")

                system_prompt = f"""You are a social media content specialist.
Create 3 template versions for {situation_en} in a {tone_en} tone.

Requirements:
1. Suitable for YouTube community posts or comments
2. Length: 3-7 lines
3. Emojis allowed (use appropriately)
4. Each version should differ in approach/length
5. Safe wording with low legal risk

Return JSON ONLY (no markdown, no extra text):
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "Template version 1 (concise)",
      "tone": "Concise",
      "reasoning": "Why this works",
      "confidence": 0.90
    }},
    {{
      "version": 2,
      "text": "Template version 2 (balanced)",
      "tone": "Balanced",
      "reasoning": "Why this works",
      "confidence": 0.88
    }},
    {{
      "version": 3,
      "text": "Template version 3 (detailed)",
      "tone": "Detailed",
      "reasoning": "Why this works",
      "confidence": 0.85
    }}
  ]
}}"""

                topic_text = f"\nTopic/context: {topic}" if topic else ""
                user_prompt = f"""Situation: {situation_en}{topic_text}

Please generate 3 template versions in a {tone_en} tone."""
            # 장소영~여기까지
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.8,
                        "max_tokens": 1500
                    }
                )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                logger.info(f"📝 Groq response length: {len(content)} characters")
                
                json_result = self.analyzer._extract_json(content)
                
                if json_result and "suggestions" in json_result:
                    suggestions = []
                    for item in json_result["suggestions"]:
                        tone_val = item.get("tone", tone)
                        version_val = item.get("version", 1)
                        if tone_val:
                            version_val = f"{version_val} ({tone_val})"

                        suggestions.append(SuggestionOption(
                            version=version_val,
                            text=item.get("text", ""),
                            tone=tone_val,
                            reasoning=item.get("reasoning", ""),
                            confidence=item.get("confidence", 0.85)
                        ))
                    
                    logger.info(f"Generated {len(suggestions)} template versions")
                    return suggestions
                else:
                    logger.warning("Failed to parse template response")
                    return self._fallback_template(situation, tone)
            else:
                logger.error(f"Template API error: {response.status_code}")
                return self._fallback_template(situation, tone)
                
        except Exception as e:
            logger.error(f"Template generation failed: {e}")
            return self._fallback_template(situation, tone)

    
    def _fallback_improvement(self, text: str, tone: str) -> List[SuggestionOption]:
        """텍스트 개선 폴백"""
        return [
            SuggestionOption(
                version=1,
                text=f"{text} (더 공손한 표현으로 수정 필요)",
                tone=tone,
                reasoning="API 오류로 인한 기본 제안",
                confidence=0.5
            ),
            SuggestionOption(
                version=2,
                text=f"{text} (중립적 표현으로 수정 필요)",
                tone="neutral",
                reasoning="API 오류로 인한 기본 제안",
                confidence=0.5
            ),
            SuggestionOption(
                version=3,
                text=f"{text} (친근한 표현으로 수정 필요)",
                tone="friendly",
                reasoning="API 오류로 인한 기본 제안",
                confidence=0.5
            )
        ]
    
    def _fallback_reply(self, comment: str, reply_type: str) -> List[SuggestionOption]:
        """답변 생성 폴백"""
        return [
            SuggestionOption(
                version=1,
                text="소중한 의견 감사합니다. 더 나은 콘텐츠로 보답하겠습니다.",
                tone="grateful",
                reasoning="기본 감사 답변",
                confidence=0.6
            ),
            SuggestionOption(
                version=2,
                text="피드백 감사드립니다. 어떤 부분을 개선하면 좋을지 구체적으로 알려주시면 큰 도움이 됩니다.",
                tone="constructive",
                reasoning="건설적 피드백 요청",
                confidence=0.6
            ),
            SuggestionOption(
                version=3,
                text="의견 주셔서 감사합니다. 앞으로 더 신중히 콘텐츠를 제작하겠습니다.",
                tone="apologetic",
                reasoning="사과와 개선 의지",
                confidence=0.6
            )
        ]
    
    def _fallback_template(self, situation: str, tone: str) -> List[SuggestionOption]:
        """템플릿 생성 폴백"""
        templates = {
            "promotion": "새로운 콘텐츠를 준비했습니다! 많은 관심 부탁드립니다 🙏",
            "announcement": "안녕하세요! 중요한 공지 사항을 전달드립니다.",
            "apology": "불편을 드려 진심으로 사과드립니다. 더 나은 모습으로 찾아뵙겠습니다.",
            "feedback_request": "여러분의 소중한 의견을 듣고 싶습니다. 댓글로 의견 남겨주세요!"
        }
        
        base_text = templates.get(situation, "게시글 내용")
        
        return [
            SuggestionOption(
                version=1,
                text=base_text,
                tone=tone,
                reasoning="기본 템플릿",
                confidence=0.6
            ),
            SuggestionOption(
                version=2,
                text=f"{base_text} (상세 버전)",
                tone=tone,
                reasoning="기본 템플릿 확장",
                confidence=0.6
            ),
            SuggestionOption(
                version=3,
                text=f"{base_text} (간결 버전)",
                tone=tone,
                reasoning="기본 템플릿 축약",
                confidence=0.6
            )
        ]


# AI 서비스 인스턴스
analyzer = GroqDualModelAnalyzer()
writing_assistant = AIWritingAssistant(analyzer)


# ==================== 기존 API 엔드포인트 (유지) ====================

@app.on_event("startup")
async def startup_event():
    """서버 시작"""
    logger.info("=" * 60)
    logger.info("SNS Content Analyzer - Groq Dual Model + AI Assistant")
    logger.info("=" * 60)
    
    if analyzer.api_key:
        logger.info("✓ Groq API configured")
        logger.info(f"  - Guard Model: {analyzer.models['guard']}")
        logger.info(f"  - Analysis Model: {analyzer.models['analysis']}")
        logger.info("  - AI Assistant: Enabled")
    else:
        logger.warning("⚠ No API key - fallback mode")


@app.get("/")
async def root():
    """API 상태"""
    return {
        "service": "SNS Content Analyzer - Groq Dual Model + AI Assistant",
        "status": "running",
        "version": "3.1.0",
        "models": {
            "guard": analyzer.models["guard"],
            "analysis": analyzer.models["analysis"]
        },
        "features": [
            "Dual model analysis",
            "13 safety categories",
            "AI Writing Assistant",
            "Text improvement",
            "Reply generation",
            "Template creation"
        ],
        "endpoints": {
            "content_analysis": "/analyze/text",
            "ai_assistant_analyze": "/api/assistant/analyze",
            "ai_assistant_improve": "/api/assistant/improve",
            "ai_assistant_reply": "/api/assistant/reply",
            "ai_assistant_template": "/api/assistant/template"
        }
    }


@app.post("/analyze/text", response_model=AnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """텍스트 분석 (듀얼 모델)"""
    logger.info(f"Analyzing text (length: {len(request.text)}, dual: {request.use_dual_model})")
    result = await analyzer.analyze_text(
        text=request.text, 
        language=request.language,
        use_dual_model=request.use_dual_model,
        model_name=request.model_name,
        custom_blocked_words=request.custom_blocked_words
    )
    return result


@app.post("/analyze/batch")
async def analyze_batch(
    texts: List[str], 
    language: str = "ko",
    use_dual_model: bool = True
):
    """대량 분석"""
    logger.info(f"Batch analysis: {len(texts)} texts")
    
    results = []
    for text in texts[:10]:
        try:
            result = await analyzer.analyze_text(text, language, use_dual_model)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed: {e}")
            results.append(None)
    
    
    return {
        "total": len(results),
        "results": results,
        "dual_model": use_dual_model,
        "processed_at": datetime.now().isoformat()
    }


# ==================== YouTube Crawler ====================

class YoutubeCrawlRequest(BaseModel):
    url: str

@app.post("/crawl/youtube")
async def crawl_youtube(request: YoutubeCrawlRequest):
    """유튜브 댓글 수집 (youtube-comment-downloader 사용)"""
    logger.info(f"Crawling YouTube comments for: {request.url}")
    
    try:
        from youtube_comment_downloader import YoutubeCommentDownloader
        downloader = YoutubeCommentDownloader()
        
        comments = []
        # sort_by=1 (최신순), limit=100 (최대 100개만 수집하여 테스트)
        generator = downloader.get_comments_from_url(request.url, sort_by=1)
        
        count = 0
        for comment in generator:
            # if count >= 500:
            #     break
                

            comments.append({
                "external_id": comment.get('cid', ''),
                "author": comment.get('author', 'Unknown'),
                "text": comment.get('text', ''),
                "publish_date": comment.get('time', ''),
                "author_id": comment.get('channel', ''),
                "like_count": comment.get('votes', 0)
            })
            count += 1
            
        logger.info(f"Crawled {len(comments)} comments")
        
        return {
            "status": "success",
            "video_url": request.url,
            "count": len(comments),
            "comments": comments
        }
        
    except Exception as e:
        logger.error(f"Crawling failed: {e}")
        raise HTTPException(status_code=500, detail=f"Crawling failed: {str(e)}")


# ==================== 🆕 AI Assistant 엔드포인트 ====================

@app.post("/api/assistant/analyze", response_model=AssistantResponse)
async def assistant_analyze(request: AssistantAnalyzeRequest):
    """
    AI Assistant - 원본 텍스트 분석
    
    감정 톤, 위험도, 오해 가능성 등을 빠르게 분석
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Assistant analyzing: {request.text[:50]}...")
        
        analysis = await writing_assistant.quick_analyze(
            request.text,
            request.language
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return AssistantResponse(
            success=True,
            analysis=analysis,
            suggestions=[],
            processing_time_ms=round(processing_time, 2),
            model_used="llama-guard-3-8b + llama-3.1-8b-instant"
        )
        
    except Exception as e:
        logger.error(f"Assistant analyze failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/assistant/improve", response_model=AssistantResponse)
async def assistant_improve(request: AssistantImproveRequest):
    """
    AI Assistant - 텍스트 개선
    
    원본 텍스트를 지정된 톤으로 개선하여 3가지 버전 제안
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Assistant improving text (tone: {request.tone})")
        
        # 1. 빠른 분석
        analysis = await writing_assistant.quick_analyze(
            request.text,
            request.language
        )
        
        # 2. 텍스트 개선
        suggestions = await writing_assistant.improve_text(
            request.text,
            request.tone,
            request.language,
            request.instruction
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return AssistantResponse(
            success=True,
            analysis=analysis,
            suggestions=suggestions,
            processing_time_ms=round(processing_time, 2),
            model_used="llama-3.1-8b-instant"
        )
        
    except Exception as e:
        logger.error(f"Assistant improve failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/assistant/reply", response_model=AssistantResponse)
async def assistant_reply(request: AssistantReplyRequest):
    """
    AI Assistant - 댓글 답변 생성
    
    원본 댓글에 대한 적절한 답변을 3가지 버전으로 생성
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Assistant generating reply (type: {request.reply_type})")
        
        # 1. 댓글 분석
        analysis = await writing_assistant.quick_analyze(
            request.original_comment,
            request.language
        )
        
        # 2. 답변 생성
        suggestions = await writing_assistant.generate_reply(
            request.original_comment,
            request.context,
            request.reply_type,
            request.language
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return AssistantResponse(
            success=True,
            analysis=analysis,
            suggestions=suggestions,
            processing_time_ms=round(processing_time, 2),
            model_used="llama-3.1-8b-instant"
        )
        
    except Exception as e:
        logger.error(f"Assistant reply failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/assistant/template", response_model=AssistantResponse)
async def assistant_template(request: AssistantTemplateRequest):
    """
    AI Assistant - 상황별 템플릿 생성
    
    특정 상황(홍보, 공지, 사과 등)에 맞는 템플릿을 3가지 버전으로 생성
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Assistant generating template (situation: {request.situation})")
        
        # 템플릿 생성
        suggestions = await writing_assistant.generate_template(
            request.situation,
            request.topic,
            request.tone,
            request.language
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return AssistantResponse(
            success=True,
            analysis=None,  # 템플릿 생성은 분석 불필요
            suggestions=suggestions,
            processing_time_ms=round(processing_time, 2),
            model_used="llama-3.1-8b-instant"
        )
        
    except Exception as e:
        logger.error(f"Assistant template failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/info")
async def models_info():
    """모델 정보"""
    return {
        "guard_model": {
            "name": analyzer.models["guard"],
            "purpose": "Safety filtering",
            "categories": analyzer.guard_categories,
            "speed": "~100ms"
        },
        "analysis_model": {
            "name": analyzer.models["analysis"],
            "purpose": "Detailed analysis + AI Assistant",
            "features": [
                "Scoring", 
                "Reasoning", 
                "Text improvement",
                "Reply generation",
                "Template creation"
            ],
            "speed": "~200ms"
        },
        "assistant_features": {
            "tones": list(writing_assistant.tone_mapping.keys()),
            "situations": list(writing_assistant.situation_templates.keys()),
            "reply_types": ["constructive", "grateful", "apologetic", "defensive"]
        }
    }


# ==================== 🆕 RAG Endpoints ====================

@app.post("/rag/clear-history")
async def clear_rag_history():
    """RAG 대화 기록 초기화"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG Service not initialized")
    
    rag_service.clear_history()
    return {"status": "success", "message": "Conversation history cleared"}

@app.post("/rag/load", summary="문서 로드 및 벡터 DB 구축")
async def load_documents(request: RAGLoadRequest):
    """지정된 디렉토리의 문서를 로드하여 벡터 인덱스 생성"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG Service is not initialized")
    
    try:
        # 백그라운드에서 실행하면 좋겠지만, 일단 동기로 처리 (간단 구현)
        # 대량의 문서라면 BackgroundTasks 사용 권장
        result = rag_service.load_documents(request.directory_path)
        return result
    except Exception as e:
        logger.error(f"Failed to load documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/chat", summary="RAG 기반 질의응답")
async def rag_chat(request: RAGChatRequest):
    """문서 기반 질문 답변"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG Service is not initialized")
    
    try:
        result = rag_service.query(request.question)
        return result
    except Exception as e:
        logger.error(f"RAG chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/rag/clear", summary="벡터 DB 초기화")
async def clear_vector_db():
    """벡터 저장소 삭제"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG Service is not initialized")
    
    success = rag_service.clear_vector_store()
    return {"success": success, "message": "Vector store cleared" if success else "No vector store found"}

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("SNS Content Analyzer - Groq Dual Model + AI Assistant")
    print("=" * 60)
    print("\n🚀 Models:")
    print(f"  1. {analyzer.models['guard']} - Safety filtering")
    print(f"  2. {analyzer.models['analysis']} - Analysis + AI Assistant")
    print("\n✨ AI Assistant Features:")
    print("  - Text improvement (3 versions)")
    print("  - Reply generation (3 versions)")
    print("  - Template creation (3 versions)")
    print("  - Quick emotion/risk analysis")
    print("\n💰 Cost: 100% FREE")
    print("  - Rate limit: 30 req/min")
    print("\n🔑 Setup:")
    print("  export GROQ_API_KEY=your_key")
    print("  python main_groq_dual.py")
    print("\n서버 시작 중...\n")
    
    uvicorn.run(
        "main_groq_dual:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )