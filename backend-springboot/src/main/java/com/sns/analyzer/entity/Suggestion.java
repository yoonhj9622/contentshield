// ==================== Suggestion.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "suggestions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Suggestion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long suggestionId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SuggestionStatus status = SuggestionStatus.SUBMITTED;
    
    @Column(columnDefinition = "TEXT")
    private String adminResponse;
    
    private Long respondedBy;
    
    private LocalDateTime respondedAt;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum SuggestionStatus {
        SUBMITTED, IN_PROGRESS, COMPLETED, REJECTED
    }
}