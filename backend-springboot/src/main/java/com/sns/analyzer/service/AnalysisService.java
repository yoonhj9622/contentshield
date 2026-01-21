// ==================== AnalysisService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Map;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AnalysisService {
    
    private final CommentRepository commentRepository;
    private final AnalysisResultRepository analysisResultRepository;
    private final BlacklistService blacklistService;
    private final RestTemplate restTemplate;
    
    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;
    
    /**
     * 댓글 분석
     */
    public AnalysisResult analyzeComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        
        // AI 서비스 호출
        Map<String, Object> aiResult = callAIService(comment.getCommentText());
        
        // 분석 결과 저장
        AnalysisResult result = AnalysisResult.builder()
            .commentId(commentId)
            .userId(userId)
            .toxicityScore(toBigDecimal(aiResult.get("toxicity_score")))
            .hateSpeechScore(toBigDecimal(aiResult.get("hate_speech_score")))
            .profanityScore(toBigDecimal(aiResult.get("profanity_score")))
            .threatScore(toBigDecimal(aiResult.get("threat_score")))
            .violenceScore(toBigDecimal(aiResult.get("violence_score")))
            .sexualScore(toBigDecimal(aiResult.get("sexual_score")))
            .confidenceScore(toBigDecimal(aiResult.get("confidence_score")))
            .category((String) aiResult.getOrDefault("category", "UNKNOWN"))
            .detectedKeywords(aiResult.get("detected_keywords") != null ? 
                aiResult.get("detected_keywords").toString() : "")
            .aiReasoning((String) aiResult.getOrDefault("llama_reasoning", ""))
            .aiModelVersion((String) aiResult.getOrDefault("ai_model_version", "unknown"))
            .processingTimeMs(toInteger(aiResult.get("processing_time_ms")))
            .analyzedAt(LocalDateTime.now())
            .build();
        
        AnalysisResult savedResult = analysisResultRepository.save(result);
        
        // 댓글 상태 업데이트
        Boolean isMalicious = (Boolean) aiResult.getOrDefault("is_malicious", false);
        comment.setIsAnalyzed(true);
        comment.setIsMalicious(isMalicious);
        comment.setUpdatedAt(LocalDateTime.now());
        commentRepository.save(comment);
        
        // 악성이면 블랙리스트 체크
        if (Boolean.TRUE.equals(isMalicious)) {
            checkAndAddToBlacklist(userId, comment);
        }
        
        return savedResult;
    }
    
    /**
     * AI 서비스 호출
     */
    private Map<String, Object> callAIService(String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> request = Map.of(
                "text", text,
                "language", "ko",
                "use_dual_model", true
            );
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                aiServiceUrl + "/analyze/text",
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            @SuppressWarnings("unchecked")
            Map<String, Object> body = response.getBody();
            return body != null ? body : Map.of();
            
        } catch (Exception e) {
            throw new RuntimeException("AI service call failed: " + e.getMessage());
        }
    }
    
    /**
     * 블랙리스트 자동 추가 체크
     */
    private void checkAndAddToBlacklist(Long userId, Comment comment) {
        String authorIdentifier = comment.getAuthorIdentifier();
        
        if (authorIdentifier == null || authorIdentifier.isEmpty()) {
            return;
        }
        
        // 이미 블랙리스트에 있는지 확인
        if (blacklistService.isBlacklisted(userId, authorIdentifier)) {
            blacklistService.incrementViolationCount(userId, authorIdentifier);
        } else {
            // 이 작성자의 악성 댓글 수 확인
            // 임계값(3개) 이상이면 자동 블랙리스트 추가
            // 실제로는 더 복잡한 로직 필요
        }
    }
    
    /**
     * 사용자의 분석 결과 조회
     */
    public List<AnalysisResult> getUserAnalysisResults(Long userId) {
        return analysisResultRepository.findByUserId(userId);
    }
    
    /**
     * BigDecimal 변환 헬퍼
     */
    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue());
        }
        try {
            return new BigDecimal(value.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
    
    /**
     * Integer 변환 헬퍼
     */
    private Integer toInteger(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            return 0;
        }
    }
}