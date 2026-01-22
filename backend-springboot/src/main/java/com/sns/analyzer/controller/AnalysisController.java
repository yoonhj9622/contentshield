package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
//@CrossOrigin(origins = "*") 윤혜정

public class AnalysisController {
    
    private final AnalysisService analysisService;
    private final UserService userService;
    
    /**
     * 단일 댓글 분석
     */
    @PostMapping("/comment")
    public ResponseEntity<?> analyzeComment(
        Authentication authentication,
        @RequestBody Map<String, Object> request
    ) {
        try {
            Long userId = getUserId(authentication);
            Long commentId = Long.valueOf(request.get("commentId").toString());
            
            AnalysisResult result = analysisService.analyzeComment(commentId, userId);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 분석 결과 조회
     */
    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResult>> getAnalysisHistory(
        Authentication authentication
    ) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(analysisService.getUserAnalysisResults(userId));
    }
    
    /**
     * 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication authentication) {
        Long userId = getUserId(authentication);
        
        List<AnalysisResult> results = analysisService.getUserAnalysisResults(userId);
        
        long totalAnalyzed = results.size();
        long maliciousCount = results.stream()
            .filter(r -> r.getToxicityScore() != null && r.getToxicityScore().doubleValue() > 50.0)
            .count();
        
        return ResponseEntity.ok(Map.of(
            "totalAnalyzed", totalAnalyzed,
            "maliciousCount", maliciousCount,
            "maliciousRate", totalAnalyzed > 0 ? (maliciousCount * 100.0 / totalAnalyzed) : 0.0
        ));
    }
    
    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }

    /**윤혜정
     * 텍스트 직접 분석 (댓글 저장 없이)
     */
    @PostMapping("/text")
    public ResponseEntity<?> analyzeText(
        Authentication authentication,
        @RequestBody Map<String, Object> request
    ) {
        try {
            Long userId = getUserId(authentication);
            String text = (String) request.get("text");
            
            if (text == null || text.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Text is required"));
            }
            
            Map<String, Object> result = analysisService.analyzeText(text, userId);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

