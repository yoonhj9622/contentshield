// ==================== AIWritingSession.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_writing_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AIWritingSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sessionId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String originalText;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String improvedText;
    
    @Column(nullable = false, length = 50)
    private String improvementType;
    
    @Column(columnDefinition = "TEXT")
    private String suggestionsSummary;
    
    @Column(nullable = false)
    private Boolean wasAccepted = false;
    
    @Column(length = 50)
    private String aiModelUsed;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}