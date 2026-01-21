// ==================== AnalysisDTO.java ====================
package com.sns.analyzer.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class AnalysisDTO {
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AnalysisRequest {
        private Long commentId;
        private String text;
        private String language;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AnalysisResponse {
        private Long analysisId;
        private Long commentId;
        private Boolean isMalicious;
        private Double toxicityScore;
        private Double hateSpeechScore;
        private Double profanityScore;
        private Double threatScore;
        private Double violenceScore;
        private Double sexualScore;
        private Double confidenceScore;
        private String category;
        private List<String> detectedKeywords;
        private String aiReasoning;
        private String aiModelVersion;
        private Integer processingTimeMs;
        private LocalDateTime analyzedAt;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AnalysisStatsResponse {
        private Long totalAnalyzed;
        private Long maliciousCount;
        private Long safeCount;
        private Double maliciousRate;
        private Double averageToxicity;
        private Double averageConfidence;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BatchAnalysisRequest {
        private List<Long> commentIds;
        private Boolean useDualModel;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BatchAnalysisResponse {
        private Integer totalProcessed;
        private Integer successCount;
        private Integer failedCount;
        private List<AnalysisResponse> results;
    }
}