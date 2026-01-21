// ==================== Comment.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Comment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentId;
    
    @Column(nullable = false)
    private Long postId;
    
    @Column(nullable = false, length = 200)
    private String externalCommentId;
    
    @Column(nullable = false, length = 200)
    private String authorName;
    
    @Column(length = 200)
    private String authorIdentifier;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String commentText;
    
    @Column(nullable = false)
    private LocalDateTime commentedAt;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer likeCount = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer replyCount = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isAnalyzed = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isMalicious = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isHidden = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isBlacklisted = false;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
