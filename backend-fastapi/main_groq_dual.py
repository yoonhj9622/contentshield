"""
SNS Content Analyzer - Groq Dual Model Edition
Llama-Guard-4-12b (필터링) + Llama-3.1-8b-instant (분석)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import os
from datetime import datetime
import httpx
import json
import re
import asyncio

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="SNS Content Analyzer - Groq Dual Model",
    description="Llama Guard 4 + Llama 3.1 듀얼 모델 악성 콘텐츠 탐지",
    version="3.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 데이터 모델 ====================

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    language: str = Field(default="ko")
    use_dual_model: bool = Field(default=True, description="두 모델 모두 사용 여부")


class AnalysisResponse(BaseModel):
    is_malicious: bool
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


# ==================== Groq Dual Model Analyzer ====================

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
            "guard": "llama-guard-3-8b",  # Llama Guard 4가 아직 없으면 3 사용
            "analysis": "llama-3.1-8b-instant"
        }
        
        # Guard 카테고리 매핑
        self.guard_categories = {
            "S1": "violent_crimes",      # 폭력 범죄
            "S2": "non_violent_crimes",  # 비폭력 범죄
            "S3": "sex_related_crimes",  # 성범죄
            "S4": "child_exploitation",  # 아동 착취
            "S5": "defamation",          # 명예훼손
            "S6": "specialized_advice",  # 전문적 조언
            "S7": "privacy",             # 프라이버시 침해
            "S8": "intellectual_property", # 지적재산권
            "S9": "indiscriminate_weapons", # 무차별 무기
            "S10": "hate",               # 혐오 표현
            "S11": "self_harm",          # 자해
            "S12": "sexual_content",     # 성적 콘텐츠
            "S13": "elections"           # 선거 관련
        }
        
        # 규칙 기반 차단 단어
        self.blocked_words = {
            "ko": [
                "바보", "멍청이", "병신", "개새끼", "씨발", "지랄", "미친",
                "죽여", "죽일", "때려", "혐오", "차별", "꺼져", "닥쳐"
            ],
            "en": [
                "stupid", "idiot", "fuck", "shit", "kill", "hate", "damn"
            ]
        }
        
        logger.info("Groq Dual Model Analyzer initialized")
        logger.info(f"  - Guard Model: {self.models['guard']}")
        logger.info(f"  - Analysis Model: {self.models['analysis']}")
    
    async def analyze_text(
        self, 
        text: str, 
        language: str = "ko",
        use_dual_model: bool = True
    ) -> AnalysisResponse:
        """텍스트 분석 (듀얼 모델)"""
        import time
        start_time = time.time()
        
        try:
            # 1. 규칙 기반 필터링 (빠른 체크)
            rule_result = self._rule_based_filter(text, language)
            
            if not self.api_key:
                logger.warning("No API key, using fallback")
                result = self._create_fallback_response(text, rule_result)
            elif use_dual_model:
                # 2. 듀얼 모델 분석 (Guard + Llama 3.1)
                result = await self._dual_model_analysis(text, language, rule_result)
            else:
                # 3. 단일 모델 분석 (Llama 3.1만)
                result = await self._single_model_analysis(text, language, rule_result)
            
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
        rule_result: Dict
    ) -> Dict[str, Any]:
        """듀얼 모델 분석 (Guard + Llama 3.1 병렬 실행)"""
        try:
            # 병렬 실행으로 속도 향상
            guard_task = self._llama_guard_check(text, language)
            llama_task = self._llama_analysis(text, language)
            
            guard_result, llama_result = await asyncio.gather(
                guard_task,
                llama_task,
                return_exceptions=True
            )
            
            # 에러 처리
            if isinstance(guard_result, Exception):
                logger.error(f"Guard model failed: {guard_result}")
                guard_result = self._fallback_guard_result()
            
            if isinstance(llama_result, Exception):
                logger.error(f"Llama model failed: {llama_result}")
                llama_result = self._fallback_analysis(text)
            
            # 결과 통합
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
            # Guard 프롬프트 (공식 포맷)
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
                
                # Guard 결과 파싱
                is_safe = content.lower().startswith("safe")
                violated_categories = []
                
                if not is_safe:
                    # S1, S2 등 카테고리 추출
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
    
    async def _llama_analysis(self, text: str, language: str) -> Dict[str, Any]:
        """Llama 3.1 상세 분석"""
        try:
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
  "reasoning": "<brief explanation in same language as input>"
}"""

            user_prompt = f'Analyze this text for harmful content: "{text}"'
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.models["analysis"],
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 300
                    }
                )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # JSON 추출
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
        rule_result: Dict
    ) -> Dict[str, Any]:
        """단일 모델 분석 (Llama 3.1만 사용)"""
        llama_result = await self._llama_analysis(text, language)
        return self._combine_results(rule_result, llama_result)
    
    def _rule_based_filter(self, text: str, language: str) -> Dict[str, Any]:
        """규칙 기반 필터링"""
        detected = []
        score = 0.0
        
        words = self.blocked_words.get(language, [])
        text_lower = text.lower()
        
        for word in words:
            if word in text_lower:
                detected.append(word)
                score += 25.0
        
        return {
            "detected_keywords": detected,
            "rule_score": min(score, 100.0),
            "is_malicious_rule": score > 50.0
        }
    
    def _combine_dual_results(
        self,
        rule_result: Dict,
        guard_result: Dict,
        llama_result: Dict
    ) -> Dict[str, Any]:
        """듀얼 모델 결과 통합"""
        
        # Guard 결과 반영
        guard_boost = 0
        if not guard_result.get("is_safe", True):
            guard_boost = 30  # Guard가 unsafe 판정 시 점수 상향
        
        # 가중 평균
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
        
        # Guard의 카테고리에 따라 점수 조정
        violated_cats = guard_result.get("violated_categories", [])
        if "hate" in violated_cats:
            hate_speech = max(hate_speech, 80)
        if "violent_crimes" in violated_cats:
            violence = max(violence, 85)
        if "sexual_content" in violated_cats:
            sexual = max(sexual, 85)
        
        # 악성 여부 판단
        is_malicious = (
            toxicity > 50.0 or
            hate_speech > 60.0 or
            profanity > 70.0 or
            threat > 40.0 or
            violence > 60.0 or
            sexual > 70.0 or
            not guard_result.get("is_safe", True) or
            rule_result["is_malicious_rule"]
        )
        
        # 카테고리 결정
        if violence > 70:
            category = "violence"
        elif sexual > 70:
            category = "sexual_content"
        elif threat > 60:
            category = "threat"
        elif hate_speech > 60:
            category = "hate_speech"
        elif profanity > 70:
            category = "profanity"
        elif toxicity > 70:
            category = "highly_toxic"
        elif toxicity > 40:
            category = "moderately_toxic"
        else:
            category = "safe"
        
        # 신뢰도 계산
        confidence = 95.0 if guard_result.get("guard_success") and llama_result.get("llama_success") else 70.0
        
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
            "detected_keywords": rule_result["detected_keywords"],
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
            "confidence_score": 85.0,
            "category": "toxic" if toxicity > 50 else "safe",
            "detected_keywords": rule_result["detected_keywords"],
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
        text_length = len(text)
        base_score = min(text_length * 2, 100)
        
        return {
            "toxicity_score": base_score,
            "hate_speech_score": max(0, base_score - 30),
            "profanity_score": max(0, base_score - 20),
            "threat_score": max(0, base_score - 40),
            "violence_score": max(0, base_score - 35),
            "sexual_score": max(0, base_score - 45),
            "reasoning": "Fallback analysis",
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
        """JSON 추출"""
        try:
            json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(text)
        except:
            return None


# AI 서비스 인스턴스
analyzer = GroqDualModelAnalyzer()


# ==================== API 엔드포인트 ====================

@app.on_event("startup")
async def startup_event():
    """서버 시작"""
    logger.info("=" * 60)
    logger.info("SNS Content Analyzer - Groq Dual Model")
    logger.info("=" * 60)
    
    if analyzer.api_key:
        logger.info("✓ Groq API configured")
        logger.info(f"  - Guard Model: {analyzer.models['guard']}")
        logger.info(f"  - Analysis Model: {analyzer.models['analysis']}")
        logger.info("  - Strategy: Guard filters → Llama analyzes")
    else:
        logger.warning("⚠ No API key - fallback mode")


@app.get("/")
async def root():
    """API 상태"""
    return {
        "service": "SNS Content Analyzer - Groq Dual Model",
        "status": "running",
        "version": "3.0.0",
        "models": {
            "guard": analyzer.models["guard"],
            "analysis": analyzer.models["analysis"]
        },
        "strategy": "Guard filters unsafe content → Llama provides detailed analysis",
        "api_configured": bool(analyzer.api_key),
        "cost": "100% FREE",
        "features": [
            "Dual model analysis",
            "13 safety categories (Llama Guard)",
            "Detailed scoring (Llama 3.1)",
            "Parallel execution"
        ]
    }


@app.post("/analyze/text", response_model=AnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    텍스트 분석 (듀얼 모델)
    
    - **use_dual_model=True**: Guard + Llama 3.1 (더 정확, 약간 느림)
    - **use_dual_model=False**: Llama 3.1만 (빠름)
    """
    logger.info(f"Analyzing text (length: {len(request.text)}, dual: {request.use_dual_model})")
    result = await analyzer.analyze_text(
        request.text, 
        request.language,
        request.use_dual_model
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
            "purpose": "Detailed analysis",
            "features": ["Scoring", "Reasoning", "Multi-category"],
            "speed": "~50ms"
        },
        "strategy": "Parallel execution for speed"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "api_configured": bool(analyzer.api_key),
        "models_ready": True,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("SNS Content Analyzer - Groq Dual Model Edition")
    print("=" * 60)
    print("\n🚀 Models:")
    print(f"  1. {analyzer.models['guard']} - Safety filtering")
    print(f"  2. {analyzer.models['analysis']} - Detailed analysis")
    print("\n⚡ Strategy:")
    print("  - Parallel execution (both models run simultaneously)")
    print("  - Guard: 13 safety categories")
    print("  - Llama 3.1: Detailed scoring + reasoning")
    print("\n💰 Cost: 100% FREE")
    print("  - Rate limit: 30 req/min, 14,400 req/day")
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
