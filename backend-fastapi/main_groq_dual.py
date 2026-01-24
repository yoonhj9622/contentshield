"""
SNS Content Analyzer - Groq Dual Model Edition (MVP)
Llama-Guard-4-12b (필터링) + Llama-3.1-8b-instant (분석)

✅ v3.1.0 변경
- scam/spam 제거 (MVP 범위에서 제외)
- 카테고리 재정의
- AI 분석 의견을 사람 말투 장문으로 후처리 생성
"""

from fastapi import FastAPI, HTTPException, Body, Request
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
import urllib.parse

from dotenv import load_dotenv


# ✅ Windows에서 .env 인코딩 이슈 대비
def _safe_load_dotenv():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    for enc in ("utf-8", "utf-8-sig", "utf-16", "utf-16-le", "cp949"):
        try:
            load_dotenv(dotenv_path=env_path, override=False, encoding=enc)
            return
        except UnicodeDecodeError:
            continue
        except Exception:
            continue


_safe_load_dotenv()

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="SNS Content Analyzer - Groq Dual Model (MVP)",
    description="Llama Guard 4 + Llama 3.1 듀얼 모델 악성 콘텐츠 탐지 (스팸/사기 제외)",
    version="3.1.0",
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
    language: str = Field(default="auto", description="ko/en 또는 auto(자동 감지)")  # ✅ ko/en만
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

    # Llama 3.1 결과 (원문 reasoning 대신, 서버에서 재작성한 장문 피드백)
    llama_reasoning: Optional[str] = None

    ai_model_version: str
    processing_time_ms: float
    analyzed_at: str


# ==================== Groq Dual Model Analyzer ====================

class GroqDualModelAnalyzer:
    """Llama Guard 4 + Llama 3.1 듀얼 모델 분석 서비스 (MVP: scam/spam 제외)"""

    def __init__(self):
        self.model_version = "groq-dual-llama-guard4-llama3.1-mvp-v3.1.0"
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

        if not self.api_key:
            logger.warning("⚠️ GROQ_API_KEY not set")
            logger.warning("  Get FREE API key: https://console.groq.com/keys")
        else:
            logger.info("✓ Groq API key configured")

        self.models = {
            "guard": "meta-llama/llama-guard-4-12b",
            "analysis": "llama-3.1-8b-instant",
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
            "S13": "elections",
        }

        # 규칙 기반 차단 단어(최소 예시) - ko/en만
        self.blocked_words = {
            "ko": ["바보", "멍청이", "병신", "개새끼", "씨발", "지랄", "미친", "꺼져", "닥쳐", "ㅅㅂ", "ㅂㅅ"],
            "en": ["stupid", "idiot", "fuck", "shit", "hate", "damn"],
        }

        # 동일 입력 결과 고정 캐시
        self._result_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_max_items: int = 300

        logger.info("Groq Dual Model Analyzer initialized")
        logger.info(f"  - Guard Model: {self.models['guard']}")
        logger.info(f"  - Analysis Model: {self.models['analysis']}")

    # ==================== 언어 감지 ====================
    def _detect_language_simple(self, text: str) -> str:
        """✅ ko/en만 감지"""
        if not text:
            return "en"
        if re.search(r"[가-힣]", text):
            return "ko"
        return "en"

    # ==================== 캐시 키 ====================
    def _normalize_text_for_cache(self, text: str) -> str:
        if not text:
            return ""
        t = text.strip()
        t = re.sub(r"\s+", " ", t)
        return t

    def _make_cache_key(self, text: str, language: str, use_dual_model: bool) -> str:
        import hashlib

        norm = self._normalize_text_for_cache(text)
        raw = f"{language}||{str(use_dual_model)}||{norm}".encode("utf-8", errors="ignore")
        return hashlib.sha256(raw).hexdigest()

    # ==================== 마스킹 ====================
    def _mask_text_for_api(self, text: str, language: str) -> str:
        """
        ✅ Groq 정책/필터에 걸려 API가 응답 자체를 실패하는 경우 우회 목적
        - blocked_words만 [MASK] 처리
        """
        try:
            words = self.blocked_words.get(language, [])
            if not words:
                return text

            masked = text
            for w in words:
                if not w:
                    continue
                pattern = re.compile(re.escape(w), flags=re.IGNORECASE)
                masked = pattern.sub("[MASK]", masked)

            return masked
        except Exception:
            return text

    # ==================== MVP 카테고리 재정의 ====================
    def _decide_category_mvp(
        self,
        toxicity: float,
        threat: float,
        violence: float,
        hate: float,
        sexual: float,
        protected_group: bool,
        guard_violated: List[str],
    ) -> str:
        """
        ✅ MVP 발표용 카테고리(스팸/사기 제외)
        - safe / toxic / hate_speech / threat / violence / sexual_content
        + (옵션) guard가 명확히 찍은 경우 defamation/privacy도 보여주고 싶으면 여기서 추가 가능
        """
        # Guard 기반 보정
        if "defamation" in guard_violated:
            return "defamation"
        if "privacy" in guard_violated:
            return "privacy"

        if threat > 45:
            return "threat"
        if violence > 65:
            return "violence"
        if sexual > 75:
            return "sexual_content"
        if hate > 65 and protected_group:
            return "hate_speech"
        if toxicity > 55:
            return "toxic"
        return "safe"

    # ==================== 장문 피드백 생성(서버 후처리) ====================
    def _make_reasoning_longform(
        self,
        language: str,
        category: str,
        text: str,
        detected_keywords: List[str],
        toxicity: float,
        threat: float,
        violence: float,
        hate: float,
        sexual: float,
        protected_group: bool,
        guard_violated: List[str],
    ) -> str:
        """
        ✅ 숫자 나열 대신, 사람 말투 장문 설명
        ✅ 발표/시연에서 “진짜 서비스처럼 보이는” 피드백 텍스트
        """

        def level_ko(x: float) -> str:
            if x >= 75:
                return "높은 편"
            if x >= 55:
                return "꽤 있는 편"
            if x >= 35:
                return "약간 있는 편"
            return "크지 않은 편"

        def level_en(x: float) -> str:
            if x >= 75:
                return "high"
            if x >= 55:
                return "moderate"
            if x >= 35:
                return "some"
            return "low"

        # 간단한 “바꿔쓰기” 예시 생성(LLM 없이 템플릿)
        def rewrite_ko(cat: str) -> List[str]:
            base = []
            if cat == "toxic":
                base = [
                    "표현이 다소 공격적으로 들릴 수 있어요. ‘나는 ~라고 느꼈다’처럼 감정/사실 중심으로 바꿔보면 좋습니다.",
                    "상대를 평가하는 문장 대신, 구체적인 행동/상황을 짚어 말하면 갈등이 줄어듭니다.",
                ]
            elif cat == "hate_speech":
                base = [
                    "특정 집단/정체성을 일반화하는 표현은 오해와 차별로 이어질 수 있어요. 대상 지칭을 빼고 ‘해당 행동’에만 초점을 맞춰보세요.",
                    "‘~은 다 그렇다’ 같은 일반화 대신, ‘일부 사례에서 이런 문제가 있었다’처럼 범위를 좁혀 말하는 게 안전합니다.",
                ]
            elif cat == "threat":
                base = [
                    "상대가 ‘협박’으로 느낄 수 있는 문구는 피하는 게 좋아요. 요구/경고가 필요하다면 규정/절차 안내 형태로 바꾸는 걸 추천합니다.",
                    "직접적 제재 언급보단 ‘필요하면 신고/차단을 검토하겠다’처럼 중립적으로 정리해보세요.",
                ]
            elif cat == "violence":
                base = [
                    "폭력적 표현은 과장/비유라도 오해 소지가 커요. 감정 표현은 ‘화가 났다/불쾌하다’처럼 비폭력적으로 바꾸는 게 안전합니다.",
                ]
            elif cat == "sexual_content":
                base = [
                    "성적 뉘앙스는 맥락에 따라 불쾌감을 줄 수 있어요. 노골적/암시적 표현은 줄이고 정보 전달 위주로 바꿔보세요.",
                ]
            elif cat == "defamation":
                base = [
                    "특정 개인/단체를 단정적으로 비난하면 명예훼손 이슈가 될 수 있어요. 사실 확인 전에는 ‘의심된다/추정된다’ 같은 표현이 안전합니다.",
                    "실명/구체 정보가 포함되어 있다면 가리는 것을 권장합니다.",
                ]
            elif cat == "privacy":
                base = [
                    "개인정보(연락처/주소/실명 등) 노출은 위험해요. 해당 정보는 삭제하거나 익명 처리하는 게 안전합니다.",
                ]
            else:
                base = [
                    "현재 문장은 큰 위험 신호는 크지 않아 보입니다. 다만 민감한 주제라면 중립적인 표현을 유지하면 더 안전합니다."
                ]
            return base

        def rewrite_en(cat: str) -> List[str]:
            base = []
            if cat == "toxic":
                base = [
                    "This may come across as hostile. Consider switching to an 'I feel / I think' framing and focus on the specific behavior.",
                    "Avoid labeling the person; describe the situation and what you'd like to change.",
                ]
            elif cat == "hate_speech":
                base = [
                    "Generalizations about an identity/protected group can be perceived as discriminatory. Remove group labels and focus on the behavior.",
                    "Use narrower scope language (e.g., 'in some cases') instead of blanket statements.",
                ]
            elif cat == "threat":
                base = [
                    "This could be perceived as a threat. If you need to enforce rules, phrase it as a neutral policy/procedure notice.",
                    "Consider a calm escalation path (report/block) instead of intimidation.",
                ]
            elif cat == "violence":
                base = [
                    "Violent wording can be risky even as a metaphor. Use non-violent emotional descriptions instead.",
                ]
            elif cat == "sexual_content":
                base = [
                    "Sexual implications can cause discomfort depending on context. Keep wording informational and avoid suggestive phrasing.",
                ]
            elif cat == "defamation":
                base = [
                    "Definitive accusations can lead to defamation risk. Use cautious language and avoid sharing identifying details.",
                ]
            elif cat == "privacy":
                base = [
                    "Personal data exposure is risky. Remove or anonymize any identifying information.",
                ]
            else:
                base = [
                    "No strong risk signals detected. Keeping a neutral tone will make it safer in sensitive discussions."
                ]
            return base

        # 핵심 신호 문장화(숫자 대신 느낌 레벨)
        if language == "ko":
            intro = f"분석 결과, 이 문장은 **{category}** 성격으로 분류되었습니다."
            context = []

            # 범주별 설명 (MVP용)
            if category == "safe":
                context.append("전체적으로 공격적이거나 위협적인 표현이 강하지 않아, 일반적인 대화 맥락에서는 큰 문제로 보이지 않습니다.")
                context.append("다만 상대가 예민하게 받아들일 수 있는 표현이 있다면, 조금 더 중립적으로 바꾸면 안전합니다.")
            elif category == "toxic":
                context.append("문장에 상대를 평가하거나 깎아내리는 뉘앙스가 포함될 수 있어요.")
                context.append("특히 비꼼/조롱/단정적인 표현은 읽는 사람에게 공격적으로 전달되기 쉬워 갈등이 커질 가능성이 있습니다.")
            elif category == "hate_speech":
                context.append("특정 집단(정체성/보호집단)을 겨냥한 차별·혐오로 해석될 여지가 있어 민감합니다.")
                context.append("의도와 관계없이 ‘일반화’가 섞이면 오해가 커질 수 있어, 대상 표현을 걷어내는 편이 안전합니다.")
            elif category == "threat":
                context.append("상대가 ‘압박/협박’으로 느낄 수 있는 문구가 포함되면 분쟁 가능성이 커집니다.")
                context.append("규정 안내/절차 안내 톤으로 바꾸는 것이 안전하고, 플랫폼 정책에도 더 잘 맞습니다.")
            elif category == "violence":
                context.append("폭력적 표현은 비유라도 위험 신호로 읽힐 수 있어요.")
                context.append("감정 전달이 목적이라면 폭력 은유 대신 감정/상황을 직접 서술하는 방식이 안전합니다.")
            elif category == "sexual_content":
                context.append("성적 뉘앙스는 맥락에 따라 불쾌감을 줄 수 있어 주의가 필요합니다.")
                context.append("표현을 담백하게 정리하고, 불필요한 묘사는 피하는 것을 권장합니다.")
            elif category == "defamation":
                context.append("특정 개인/단체를 단정적으로 비난하거나 사실처럼 서술하면 명예훼손 이슈로 이어질 수 있어요.")
                context.append("사실관계가 확인되지 않았다면 단정 대신 추정 표현을 쓰는 게 안전합니다.")
            elif category == "privacy":
                context.append("개인정보(실명/연락처/주소 등)가 포함될 경우 심각한 프라이버시 침해가 될 수 있어요.")
                context.append("민감 정보는 삭제하거나 익명 처리하는 게 안전합니다.")

            # 신호 요약(레벨만)
            signal_line = (
                f"현재 톤 기준으로는 "
                f"공격성은 {level_ko(toxicity)}, "
                f"위협성은 {level_ko(threat)}, "
                f"폭력성은 {level_ko(violence)}, "
                f"혐오 가능성은 {level_ko(hate)}, "
                f"성적 뉘앙스는 {level_ko(sexual)} 정도로 해석됩니다."
            )

            # 키워드 힌트
            keyword_line = ""
            if detected_keywords:
                keyword_line = f"또한 일부 표현(키워드)이 강한 톤으로 인식될 수 있어요: {', '.join(detected_keywords)}"

            # 권장 조치
            if category in ("threat", "violence", "hate_speech", "sexual_content", "privacy"):
                action = "권장 조치: **게시 전 수정/검토**를 권장합니다. (필요 시 숨김/경고/제한 정책 적용)"
            elif category in ("defamation",):
                action = "권장 조치: **사실 확인 전 단정 표현 금지**, 실명/구체 정보 포함 여부를 점검하세요."
            elif category in ("toxic",):
                action = "권장 조치: 상대를 비난하기보다 **상황·행동 중심으로 표현을 완화**하면 게시 허용 가능성이 높아집니다."
            else:
                action = "권장 조치: 현 단계에서는 게시 가능하나, 민감 주제는 추가 모니터링을 권장합니다."

            # 바꿔쓰기 제안
            rewrites = rewrite_ko(category)

            # 최종 장문 구성
            parts = [
                intro,
                "",
                "해석",
                *[f"- {c}" for c in context],
                "",
                "위험 신호 요약(체감 기준)",
                f"- {signal_line}",
            ]
            if keyword_line:
                parts += ["", "참고", f"- {keyword_line}"]

            # Guard 기반 메모 (발표 때 점수보다 설득력)
            if guard_violated:
                parts += ["", "안전 정책 관점(Guard)", f"- 정책상 민감 카테고리 신호: {', '.join(guard_violated)}"]

            parts += [
                "",
                "더 안전한 표현 제안(예시)",
                *[f"- {r}" for r in rewrites],
                "",
                f"{action}",
            ]
            return "\n".join(parts)

        # English
        intro = f"Based on the analysis, this text is classified as **{category}**."
        context = []

        if category == "safe":
            context.append("No strong hostile/threatening signals are present in typical conversation contexts.")
            context.append("If the topic is sensitive, keeping a neutral tone can further reduce misunderstandings.")
        elif category == "toxic":
            context.append("The wording can be perceived as judgmental or insulting.")
            context.append("Sarcasm, ridicule, or definitive put-downs often escalate conflict even if unintended.")
        elif category == "hate_speech":
            context.append("It may be interpreted as targeting an identity/protected group, which is highly sensitive.")
            context.append("Even without intent, group generalizations can be perceived as discriminatory.")
        elif category == "threat":
            context.append("Some parts may be perceived as intimidation or coercion.")
            context.append("A neutral policy/procedure tone is safer and aligns better with platform guidelines.")
        elif category == "violence":
            context.append("Violent wording can be risky even as a metaphor.")
            context.append("Use non-violent emotional descriptions to avoid misinterpretation.")
        elif category == "sexual_content":
            context.append("Sexual implications can cause discomfort depending on context.")
            context.append("Keep it informational and avoid suggestive phrasing.")
        elif category == "defamation":
            context.append("Definitive accusations can create defamation risk.")
            context.append("Use cautious language and avoid sharing identifying details.")
        elif category == "privacy":
            context.append("Personal data exposure is risky.")
            context.append("Remove or anonymize identifying information.")

        signal_line = (
            f"Tone-level signals: toxicity {level_en(toxicity)}, threat {level_en(threat)}, "
            f"violence {level_en(violence)}, hate {level_en(hate)}, sexual {level_en(sexual)}."
        )

        keyword_line = ""
        if detected_keywords:
            keyword_line = f"Potential strong tone indicators (keywords): {', '.join(detected_keywords)}"

        if category in ("threat", "violence", "hate_speech", "sexual_content", "privacy"):
            action = "Recommended action: **revise before posting** (consider hide/warn/restrict if needed)."
        elif category == "defamation":
            action = "Recommended action: avoid definitive accusations; check for identifying details."
        elif category == "toxic":
            action = "Recommended action: soften the tone and focus on behavior/situation rather than labeling a person."
        else:
            action = "Recommended action: allow, but monitor sensitive contexts."

        rewrites = rewrite_en(category)

        parts = [
            intro,
            "",
            "Interpretation",
            *[f"- {c}" for c in context],
            "",
            "Signal summary (human-readable)",
            f"- {signal_line}",
        ]
        if keyword_line:
            parts += ["", "Note", f"- {keyword_line}"]
        if guard_violated:
            parts += ["", "Guard policy signal", f"- Potential sensitive categories: {', '.join(guard_violated)}"]

        parts += [
            "",
            "✅ Safer rewrite suggestions",
            *[f"- {r}" for r in rewrites],
            "",
            f"🧭 {action}",
        ]
        return "\n".join(parts)

    # ==================== 메인 분석 ====================
    async def analyze_text(self, text: str, language: str = "auto", use_dual_model: bool = True) -> AnalysisResponse:
        import time

        start_time = time.time()

        try:
            if not language or language == "auto":
                language = self._detect_language_simple(text)

            # 캐시 히트
            cache_key = self._make_cache_key(text, language, use_dual_model)
            cached = self._result_cache.get(cache_key)
            if isinstance(cached, dict):
                result = dict(cached)
                processing_time = (time.time() - start_time) * 1000
                result["processing_time_ms"] = round(processing_time, 2)
                result["analyzed_at"] = datetime.now().isoformat()
                result["ai_model_version"] = self.model_version
                return AnalysisResponse(**result)

            # 1) 룰 기반
            rule_result = self._rule_based_filter(text, language)

            if not self.api_key:
                logger.warning("No API key, using fallback")
                result = self._create_fallback_response(text, rule_result, language)
            elif use_dual_model:
                result = await self._dual_model_analysis(text, language, rule_result)
            else:
                result = await self._single_model_analysis(text, language, rule_result)

            # 시간/버전 필드
            processing_time = (time.time() - start_time) * 1000
            result["processing_time_ms"] = round(processing_time, 2)
            result["analyzed_at"] = datetime.now().isoformat()
            result["ai_model_version"] = self.model_version

            # 장문 reasoning은 서버에서 재작성
            try:
                result["llama_reasoning"] = self._make_reasoning_longform(
                    language=language,
                    category=str(result.get("category", "safe")),
                    text=text,
                    detected_keywords=result.get("detected_keywords", []),
                    toxicity=float(result.get("toxicity_score", 0)),
                    threat=float(result.get("threat_score", 0)),
                    violence=float(result.get("violence_score", 0)),
                    hate=float(result.get("hate_speech_score", 0)),
                    sexual=float(result.get("sexual_score", 0)),
                    protected_group=bool(result.get("protected_group", False)),
                    guard_violated=result.get("guard_categories", []),
                )
            except Exception:
                pass

            # 캐시 저장(변동 필드 제외)
            try:
                core = dict(result)
                core.pop("processing_time_ms", None)
                core.pop("analyzed_at", None)
                core.pop("ai_model_version", None)

                if len(self._result_cache) >= self._cache_max_items:
                    oldest_key = next(iter(self._result_cache.keys()), None)
                    if oldest_key:
                        self._result_cache.pop(oldest_key, None)

                self._result_cache[cache_key] = core
            except Exception:
                pass

            # protected_group은 내부 계산용이므로 응답 모델에는 없지만,
            # dict에 남아있으면 Pydantic이 에러를 내니 제거
            result.pop("protected_group", None)

            return AnalysisResponse(**result)

        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # ==================== 듀얼 분석 ====================
    async def _dual_model_analysis(self, text: str, language: str, rule_result: Dict) -> Dict[str, Any]:
        try:
            guard_task = self._llama_guard_check(text, language)
            llama_task = self._llama_analysis(text, language)

            guard_result, llama_result = await asyncio.gather(guard_task, llama_task, return_exceptions=True)

            if isinstance(guard_result, Exception):
                logger.error(f"Guard model failed: {guard_result}")
                guard_result = self._fallback_guard_result()

            if isinstance(llama_result, Exception):
                logger.error(f"Llama model failed: {llama_result}")
                llama_result = self._fallback_analysis(text, language)

            combined = self._combine_dual_results(rule_result, guard_result, llama_result)
            return combined

        except Exception as e:
            logger.error(f"Dual model analysis failed: {e}")
            return self._create_fallback_response(text, rule_result, language)

    # ==================== Guard ====================
    async def _llama_guard_check(self, text: str, language: str) -> Dict[str, Any]:
        try:
            safe_text = self._mask_text_for_api(text, language)

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
User: {safe_text}
<END CONVERSATION>

Provide your safety assessment for User's message:
- First line must be 'safe' or 'unsafe'
- If unsafe, list all violated categories (S1, S2, etc.) [/INST]"""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.models["guard"],
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.0,
                        "max_tokens": 100,
                    },
                )

            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()

                is_safe = content.lower().startswith("safe")
                violated_categories = []

                if not is_safe:
                    categories = re.findall(r"S\d+", content)
                    violated_categories = [self.guard_categories.get(cat, cat) for cat in categories]

                return {
                    "is_safe": is_safe,
                    "violated_categories": violated_categories,
                    "raw_response": content,
                    "guard_success": True,
                }

            logger.error(f"Guard API error: {response.status_code} | body: {response.text[:800]}")
            return self._fallback_guard_result()

        except Exception as e:
            logger.error(f"Guard check failed: {e}")
            return self._fallback_guard_result()

    # ==================== Llama 분석 (scam/spam 제거 버전) ====================
    async def _llama_analysis(self, text: str, language: str) -> Dict[str, Any]:
        """Llama 3.1 상세 분석 (JSON 강제 + ko/en 전용, scam/spam 제외)"""

        lang_to_label = {"ko": "Korean", "en": "English"}
        reasoning_lang_label = lang_to_label.get(language, "English")

        safe_text = self._mask_text_for_api(text, language)

        # 욕설 힌트(마스킹된 단어가 있었다면 힌트 제공)
        hint_keywords = []
        try:
            words = self.blocked_words.get(language, [])
            text_norm = text.casefold()
            for w in words:
                if w and w.casefold() in text_norm:
                    hint_keywords.append(w)
        except Exception:
            hint_keywords = []

        system_prompt = f"""
You are an expert in analyzing toxic and harmful content for online posts/comments.

Return ONLY a single valid JSON object.
- No markdown, no extra text, no code fences.
- Do NOT include any explanations outside JSON.
- Scores must be integers 0-100 (no % sign).
- The 'reasoning' must be written in {reasoning_lang_label}.
- Do NOT translate the user's text. Analyze it as-is.
- Do NOT quote or repeat slurs/profanity.
- If the text contains [MASK], treat it as an explicit strong insult/profanity indicator.

IMPORTANT (reduce false positives):
- hate_speech_score MUST be high ONLY when the text targets an identity/protected group
  (e.g., race, nationality, ethnicity, religion, gender, sexual orientation, disability, etc.).
- If the text criticizes "some people" without identity/protected-group references,
  treat it as general toxicity/harassment, NOT hate speech.

Scoring guidance (context-first):
- toxicity_score: overall hostility/insulting tone including sarcasm/derision
- hate_speech_score: identity/protected-group based hate/discrimination
- profanity_score: explicit profanity/curse intensity
- threat_score: intimidation, implied harm, coercive consequences
- violence_score: violence encouragement/graphic violence
- sexual_score: explicit/implicit sexual content

JSON schema:
{{
  "toxicity_score": 0,
  "hate_speech_score": 0,
  "profanity_score": 0,
  "threat_score": 0,
  "violence_score": 0,
  "sexual_score": 0,
  "protected_group": false,
  "reasoning": ""
}}
""".strip()

        user_prompt = f'Text ({reasoning_lang_label}): "{safe_text}"\nDetected keywords (may be masked): {hint_keywords}'

        async def _post(payload: Dict[str, Any]) -> httpx.Response:
            async with httpx.AsyncClient(timeout=30.0) as client:
                return await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

        base_payload = {
            "model": self.models["analysis"],
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.0,
            "top_p": 1.0,
            "presence_penalty": 0.0,
            "frequency_penalty": 0.0,
            "max_tokens": 300,
        }

        payload_jsonmode = dict(base_payload)
        payload_jsonmode["response_format"] = {"type": "json_object"}

        try:
            resp = await _post(payload_jsonmode)

            if resp.status_code in (400, 422):
                logger.warning(
                    f"[LLAMA] response_format not supported. retry without it. "
                    f"status={resp.status_code} body={resp.text[:800]}"
                )
                resp = await _post(base_payload)

            if resp.status_code != 200:
                logger.error(f"[LLAMA] API error: {resp.status_code} | body: {resp.text[:1200]}")
                return self._fallback_analysis(text, language)

            result = resp.json()
            content = result["choices"][0]["message"]["content"]

            json_result = self._extract_json(content)
            if not json_result:
                logger.warning(f"[LLAMA] JSON parse failed. raw(head): {content[:600]}")
                return self._fallback_analysis(text, language)

            def _to_int(v, default=0):
                try:
                    return int(v)
                except Exception:
                    return default

            return {
                "toxicity_score": _to_int(json_result.get("toxicity_score", 0)),
                "hate_speech_score": _to_int(json_result.get("hate_speech_score", 0)),
                "profanity_score": _to_int(json_result.get("profanity_score", 0)),
                "threat_score": _to_int(json_result.get("threat_score", 0)),
                "violence_score": _to_int(json_result.get("violence_score", 0)),
                "sexual_score": _to_int(json_result.get("sexual_score", 0)),
                "protected_group": bool(json_result.get("protected_group", False)),
                "reasoning": str(json_result.get("reasoning", "")),
                "llama_success": True,
            }

        except Exception as e:
            logger.error(f"[LLAMA] analysis failed: {e}")
            return self._fallback_analysis(text, language)

    # ==================== 단일 모델 ====================
    async def _single_model_analysis(self, text: str, language: str, rule_result: Dict) -> Dict[str, Any]:
        llama_result = await self._llama_analysis(text, language)

        weight_rule = 0.3
        weight_llama = 0.7

        toxicity = rule_result["rule_score"] * weight_rule + llama_result.get("toxicity_score", 0) * weight_llama

        hate_speech = llama_result.get("hate_speech_score", 0)
        profanity = llama_result.get("profanity_score", 0)
        threat = llama_result.get("threat_score", 0)
        violence = llama_result.get("violence_score", 0)
        sexual = llama_result.get("sexual_score", 0)
        protected_group = bool(llama_result.get("protected_group", False))

        is_malicious = (
            toxicity > 55.0
            or (hate_speech > 65.0 and protected_group)
            or profanity > 75.0
            or threat > 45.0
            or violence > 65.0
            or sexual > 75.0
            or rule_result.get("is_malicious_rule", False)
        )

        category = self._decide_category_mvp(
            toxicity=toxicity,
            threat=threat,
            violence=violence,
            hate=hate_speech,
            sexual=sexual,
            protected_group=protected_group,
            guard_violated=[],  # 단일 모드에서는 guard 미사용
        )

        confidence_score = min(100.0, max(toxicity, hate_speech, profanity, threat, violence, sexual))

        return {
            "is_malicious": is_malicious,
            "toxicity_score": float(round(toxicity, 2)),
            "hate_speech_score": float(round(hate_speech, 2)),
            "profanity_score": float(round(profanity, 2)),
            "threat_score": float(round(threat, 2)),
            "violence_score": float(round(violence, 2)),
            "sexual_score": float(round(sexual, 2)),
            "confidence_score": float(round(confidence_score, 2)),
            "category": category,
            "detected_keywords": rule_result.get("detected_keywords", []),
            "guard_result": None,
            "guard_categories": [],
            "llama_reasoning": llama_result.get("reasoning", ""),
            "protected_group": protected_group,  # 내부 후처리용
        }

    # ==================== 룰 기반 ====================
    def _rule_based_filter(self, text: str, language: str) -> Dict[str, Any]:
        detected = []
        score = 0.0

        if language not in ("ko", "en"):
            language = "en"

        words = self.blocked_words.get(language, [])
        text_norm = text.casefold()

        for word in words:
            if word.casefold() in text_norm:
                detected.append(word)
                score += 15.0

        return {
            "detected_keywords": detected,
            "rule_score": min(score, 100.0),
            "is_malicious_rule": False,  # 키워드만으로 확정 금지
        }

    # ==================== 듀얼 결과 통합 (scam/spam 제거) ====================
    def _combine_dual_results(self, rule_result: Dict, guard_result: Dict, llama_result: Dict) -> Dict[str, Any]:
        guard_boost = 0
        if not guard_result.get("is_safe", True):
            guard_boost = 30

        weight_rule = 0.08
        weight_guard = 0.32
        weight_llama = 0.60

        toxicity = (
            rule_result["rule_score"] * weight_rule
            + guard_boost * weight_guard
            + llama_result.get("toxicity_score", 0) * weight_llama
        )

        hate_speech = llama_result.get("hate_speech_score", 0)
        profanity = llama_result.get("profanity_score", 0)
        threat = llama_result.get("threat_score", 0)
        violence = llama_result.get("violence_score", 0)
        sexual = llama_result.get("sexual_score", 0)
        protected_group = bool(llama_result.get("protected_group", False))

        violated_cats = guard_result.get("violated_categories", [])

        # Guard 기반 보정
        if "hate" in violated_cats:
            hate_speech = max(hate_speech, 80)
            protected_group = True
        if "violent_crimes" in violated_cats:
            violence = max(violence, 85)
        if "sexual_content" in violated_cats:
            sexual = max(sexual, 85)

        is_malicious = (
            toxicity > 55.0
            or (hate_speech > 65.0 and protected_group)
            or profanity > 75.0
            or threat > 45.0
            or violence > 65.0
            or sexual > 75.0
            or (not guard_result.get("is_safe", True))
        )

        category = self._decide_category_mvp(
            toxicity=toxicity,
            threat=threat,
            violence=violence,
            hate=hate_speech,
            sexual=sexual,
            protected_group=protected_group,
            guard_violated=violated_cats,
        )

        confidence_score = min(100.0, max(toxicity, hate_speech, profanity, threat, violence, sexual))

        return {
            "is_malicious": is_malicious,
            "toxicity_score": float(round(toxicity, 2)),
            "hate_speech_score": float(round(hate_speech, 2)),
            "profanity_score": float(round(profanity, 2)),
            "threat_score": float(round(threat, 2)),
            "violence_score": float(round(violence, 2)),
            "sexual_score": float(round(sexual, 2)),
            "confidence_score": float(round(confidence_score, 2)),
            "category": category,
            "detected_keywords": rule_result.get("detected_keywords", []),
            "guard_result": guard_result,
            "guard_categories": violated_cats,
            "llama_reasoning": llama_result.get("reasoning", ""),
            "protected_group": protected_group,  # 내부 후처리용
        }

    # ==================== fallback ====================
    def _fallback_guard_result(self) -> Dict[str, Any]:
        return {"is_safe": True, "violated_categories": [], "raw_response": "Guard unavailable", "guard_success": False}

    def _fallback_analysis(self, text: str, language: str = "en") -> Dict[str, Any]:
        # 장문 길이 기반 점수 금지 → 룰 기반으로 보수 추정
        try:
            rule = self._rule_based_filter(text, language)
            rule_score = float(rule.get("rule_score", 0.0))
        except Exception:
            rule_score = 0.0

        base_score = 5.0 if rule_score <= 0 else min(max(rule_score, 15.0), 60.0)

        fallback_reasoning_map = {
            "ko": "분석 모델 호출/파싱에 실패하여 보수적인 규칙 기반 추정 결과를 반환합니다.",
            "en": "Model call/parse failed; returning conservative rule-based estimates.",
        }
        reasoning = fallback_reasoning_map.get(language, fallback_reasoning_map["en"])

        return {
            "toxicity_score": round(base_score, 2),
            "hate_speech_score": round(max(0.0, base_score - 10.0), 2),
            "profanity_score": round(max(0.0, base_score - 5.0), 2),
            "threat_score": round(max(0.0, base_score - 15.0), 2),
            "violence_score": round(max(0.0, base_score - 12.0), 2),
            "sexual_score": round(max(0.0, base_score - 20.0), 2),
            "protected_group": False,
            "reasoning": reasoning,
            "llama_success": False,
        }

    def _create_fallback_response(self, text: str, rule_result: Dict, language: str) -> Dict[str, Any]:
        score = float(rule_result.get("rule_score", 0.0))
        # fallback category도 MVP 기준으로
        category = self._decide_category_mvp(
            toxicity=score,
            threat=max(0, score - 30),
            violence=max(0, score - 25),
            hate=max(0, score - 20),
            sexual=max(0, score - 35),
            protected_group=False,
            guard_violated=[],
        )

        return {
            "is_malicious": rule_result.get("is_malicious_rule", False),
            "toxicity_score": score,
            "hate_speech_score": max(0, score - 20),
            "profanity_score": max(0, score - 10),
            "threat_score": max(0, score - 30),
            "violence_score": max(0, score - 25),
            "sexual_score": max(0, score - 35),
            "confidence_score": 40.0,
            "category": category,
            "detected_keywords": rule_result.get("detected_keywords", []),
            "guard_result": None,
            "guard_categories": [],
            "llama_reasoning": "Fallback: Rule-based only",
            "protected_group": False,
        }

    # ==================== JSON 추출 ====================
    def _extract_json(self, text: str) -> Optional[Dict]:
        if not text:
            return None

        s = text.strip()
        s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.IGNORECASE)
        s = re.sub(r"\s*```$", "", s)

        try:
            obj = json.loads(s)
            if isinstance(obj, dict):
                return obj
        except Exception:
            pass

        start = s.find("{")
        if start == -1:
            return None

        depth = 0
        in_str = False
        esc = False
        for i in range(start, len(s)):
            ch = s[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
                continue
            else:
                if ch == '"':
                    in_str = True
                    continue
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        candidate = s[start : i + 1].strip()
                        try:
                            return json.loads(candidate)
                        except Exception:
                            candidate2 = re.sub(r",\s*}", "}", candidate)
                            candidate2 = re.sub(r",\s*]", "]", candidate2)
                            try:
                                return json.loads(candidate2)
                            except Exception:
                                return None
        return None


# AI 서비스 인스턴스
analyzer = GroqDualModelAnalyzer()


# ==================== API 엔드포인트 ====================

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("SNS Content Analyzer - Groq Dual Model (MVP v3.1.0)")
    logger.info("=" * 60)
    if analyzer.api_key:
        logger.info("✓ Groq API configured")
        logger.info(f"  - Guard Model: {analyzer.models['guard']}")
        logger.info(f"  - Analysis Model: {analyzer.models['analysis']}")
        logger.info("  - Strategy: Parallel (Guard + Llama) + server-side longform reasoning")
    else:
        logger.warning("⚠ No API key - fallback mode")


@app.get("/")
async def root():
    return {
        "service": "SNS Content Analyzer - Groq Dual Model (MVP)",
        "status": "running",
        "version": "3.1.0",
        "models": {"guard": analyzer.models["guard"], "analysis": analyzer.models["analysis"]},
        "strategy": "Guard filters unsafe content → Llama scores → Server generates longform reasoning",
        "api_configured": bool(analyzer.api_key),
        "features": [
            "Dual model analysis",
            "MVP categories (safe/toxic/hate/threat/violence/sexual + optional defamation/privacy)",
            "Longform human-like feedback (server-generated)",
        ],
    }


@app.post("/analyze/text", response_model=AnalysisResponse)
async def analyze_text(request: Request):
    """
    텍스트 분석 (듀얼 모델)

    - use_dual_model=True: Guard + Llama 3.1
    - use_dual_model=False: Llama 3.1 only
    """

    try:
        content_type = (request.headers.get("content-type") or "").lower()
        raw_bytes = await request.body()
        raw_text = raw_bytes.decode("utf-8", errors="ignore").strip()

        data: Any = None
        try:
            data = await request.json()
        except Exception:
            data = None

        payload: Dict[str, Any] = {}

        if isinstance(data, dict):
            payload = data
        elif isinstance(data, str):
            payload = {"text": data, "language": "auto", "use_dual_model": True}
        else:
            if "application/x-www-form-urlencoded" in content_type:
                parsed = urllib.parse.parse_qs(raw_text)
                payload = {
                    "text": (parsed.get("text", [""])[0] or "").strip(),
                    "language": (parsed.get("language", ["auto"])[0] or "auto").strip(),
                    "use_dual_model": str(parsed.get("use_dual_model", ["true"])[0]).lower() != "false",
                }
            else:
                payload = {"text": raw_text, "language": "auto", "use_dual_model": True}

        if not payload.get("text"):
            if payload.get("content"):
                payload["text"] = payload["content"]
            elif payload.get("message"):
                payload["text"] = payload["message"]

        req_obj = TextAnalysisRequest(**payload)

    except Exception as e:
        logger.error(
            f"[REQ] Invalid request body. content-type={request.headers.get('content-type')} raw(head)={raw_text[:200]}"
        )
        raise HTTPException(status_code=400, detail=f"Invalid request body: {str(e)}")

    raw_lang = (req_obj.language or "auto").strip().lower()
    detected = analyzer._detect_language_simple(req_obj.text)

    if raw_lang == "auto":
        used_lang = detected
    else:
        # ko/en 외 값 들어오면 보정
        if raw_lang not in ("ko", "en"):
            used_lang = detected
        else:
            used_lang = raw_lang

    logger.info(f"[LANG] raw={raw_lang} detected={detected} used={used_lang}")
    logger.info(f"Analyzing text (length: {len(req_obj.text)}, dual: {req_obj.use_dual_model})")

    result = await analyzer.analyze_text(req_obj.text, used_lang, req_obj.use_dual_model)
    return result


@app.post("/analyze/batch")
async def analyze_batch(texts: List[str] = Body(...), language: str = "auto", use_dual_model: bool = True):
    logger.info(f"Batch analysis: {len(texts)} texts")
    results = []
    for text in texts[:10]:
        try:
            result = await analyzer.analyze_text(text, language, use_dual_model)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed: {e}")
            results.append(None)

    return {"total": len(results), "results": results, "dual_model": use_dual_model, "processed_at": datetime.now().isoformat()}


@app.get("/models/info")
async def models_info():
    return {
        "guard_model": {
            "name": analyzer.models["guard"],
            "purpose": "Safety filtering",
            "categories": analyzer.guard_categories,
            "speed": "~100ms",
        },
        "analysis_model": {
            "name": analyzer.models["analysis"],
            "purpose": "Detailed scoring",
            "features": ["Scoring", "Reasoning", "Multi-category (MVP)"],
            "speed": "~50ms",
        },
        "strategy": "Parallel execution + server-side longform reasoning",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "api_configured": bool(analyzer.api_key),
        "models_ready": True,
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("SNS Content Analyzer - Groq Dual Model (MVP v3.1.0)")
    print("=" * 60)
    print("\n🚀 Models:")
    print(f"  1. {analyzer.models['guard']} - Safety filtering")
    print(f"  2. {analyzer.models['analysis']} - Detailed analysis (MVP categories)")
    print("\n⚡ Strategy:")
    print("  - Parallel execution (both models run simultaneously)")
    print("  - Server generates longform human-like feedback (no numeric dump)")
    print("\n💰 Cost: 100% FREE")
    print("\n서버 시작 중...\n")

    uvicorn.run(
        "main_groq_dual:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info",
    )
