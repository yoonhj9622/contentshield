// ==================== AnalysisStats.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_stats")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AnalysisStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long statId;
    
    @Column(nullable = false)
    private Long userId;
    
    private Long channelId;
    
    @Column(nullable = false)
    private LocalDate statDate;
    
    @Column(nullable = false)
    private Integer totalComments = 0;
    
    @Column(nullable = false)
    private Integer analyzedComments = 0;
    
    @Column(nullable = false)
    private Integer maliciousComments = 0;
    
    @Column(nullable = false)
    private Integer blockedComments = 0;
    
    @Column(nullable = false)
    private Integer hiddenComments = 0;
    
    @Column(nullable = false)
    private Integer blacklistedAuthors = 0;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}