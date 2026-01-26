// ==================== BlacklistUser.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blacklist_users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlacklistUser {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long blacklistId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "channel_id")
    private Long channelId;
    
    @Column(name = "blocked_author_name", nullable = false, length = 100)
    private String blockedAuthorName;
    
    @Column(name = "blocked_author_identifier", nullable = false, length = 200)
    private String blockedAuthorIdentifier;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Platform platform = Platform.YOUTUBE;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Column(name = "comment_text", columnDefinition = "TEXT")
    private String commentText;
    
    @Column(name = "violation_count", nullable = false)
    @Builder.Default
    private Integer violationCount = 1;
    
    @Column(name = "last_violation_at")
    private LocalDateTime lastViolationAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BlacklistStatus status = BlacklistStatus.ACTIVE;
    
    @Column(name = "auto_added", nullable = false)
    @Builder.Default
    private Boolean autoAdded = false;
    
    @Column(name = "threshold_violations")
    private Integer thresholdViolations;
    
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "removed_at")
    private LocalDateTime removedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum BlacklistStatus {
        ACTIVE, REMOVED
    }
    
    public enum Platform {
        YOUTUBE, NAVER_BLOG, INSTAGRAM, TIKTOK
    }
    
    public boolean isActive() {
        return this.status == BlacklistStatus.ACTIVE;
    }
}