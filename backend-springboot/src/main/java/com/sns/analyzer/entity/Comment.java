// ==================== Comment.java ====================
package com.sns.analyzer.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = true)
    private Long postId;

    @Column(length = 50)
    private String platform; // YOUTUBE, INSTAGRAM

    @Column(columnDefinition = "TEXT")
    private String contentUrl;

    @Column(nullable = false, length = 200)
    private String externalCommentId;

    @Column(nullable = false, length = 200)
    private String authorName;

    @Column(length = 200)
    private String authorIdentifier;

    // ✅ 필드명은 content, JSON에서는 commentText로 직렬화
    @JsonProperty("commentText")
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

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
    private LocalDateTime createdAt = LocalDateTime.now().withNano(0);

    private LocalDateTime updatedAt;

    // ========== 차단 단어 관련 임시 필드 (DB에 저장 안 됨) ==========
    @Transient
    private Boolean containsBlockedWord = false;

    @Transient
    private String matchedBlockedWord;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}