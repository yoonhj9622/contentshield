// ==================== CommentReply.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comment_replies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentReply {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long replyId;
    
    @Column(nullable = false)
    private Long commentId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String replyContent;
    
    @Column(nullable = false)
    private Boolean isPosted = false;
    
    private LocalDateTime postedAt;
    
    @Column(nullable = false)
    private Boolean isDeleted = false;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}