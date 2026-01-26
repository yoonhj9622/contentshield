// ==================== BlockedWord.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_words")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlockedWord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long wordId;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(nullable = false, length = 100)
    private String word;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WordCategory category = WordCategory.PROFANITY;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Severity severity = Severity.MEDIUM;
    
    @Column(length = 10)
    @Builder.Default
    private String language = "ko";
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum WordCategory {
        PROFANITY, HATE, VIOLENCE, SEXUAL, SPAM
    }
    
    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}