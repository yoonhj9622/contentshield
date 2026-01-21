// ==================== AnalysisResult.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_results")
@Getter @Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class AnalysisResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long analysisId;
    
    @Column(nullable = false)
    private Long commentId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal toxicityScore;
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal hateSpeechScore;
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal profanityScore;
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal threatScore;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal violenceScore;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal sexualScore;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal fakeNewsScore;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal confidenceScore;
    
    @Column(nullable = false, length = 50)
    private String category;
    
    @Column(columnDefinition = "TEXT")
    private String detectedKeywords;
    
    @Column(columnDefinition = "TEXT")
    private String aiReasoning;
    
    @Column(length = 50)
    private String aiModelVersion;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer processingTimeMs = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime analyzedAt = LocalDateTime.now();
    
    // ===== 비즈니스 메소드 추가 =====
    
    /**
     * 악성 여부 판단 (toxicityScore 기준)
     */
    public Boolean isMalicious() {
        if (this.toxicityScore == null) {
            return false;
        }
        return this.toxicityScore.compareTo(BigDecimal.valueOf(50.0)) > 0;
    }
    
    /**
     * 악성 여부 직접 반환 (getter)
     */
    public Boolean getIsMalicious() {
        return isMalicious();
    }
}