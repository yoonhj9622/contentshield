// ==================== UserChannel.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_channels")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserChannel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long channelId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Platform platform;
    
    @Column(nullable = false, length = 200)
    private String channelName;
    
    @Column(nullable = false, length = 500)
    private String channelUrl;
    
    @Column(length = 200)
    private String channelIdentifier;
    
    @Column(columnDefinition = "TEXT")
    private String apiToken;
    
    @Column(columnDefinition = "TEXT")
    private String refreshToken;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;
    
    private LocalDateTime verifiedAt;
    
    @Column(nullable = false)
    private Integer totalPosts = 0;
    
    @Column(nullable = false)
    private Integer totalComments = 0;
    
    @Column(nullable = false)
    private Integer analyzedComments = 0;
    
    @Column(nullable = false)
    private Integer blockedComments = 0;
    
    private LocalDateTime lastSyncedAt;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum Platform {
        YOUTUBE, NAVER_BLOG, INSTAGRAM, TIKTOK, TWITTER
    }
    
    public enum VerificationStatus {
        PENDING, VERIFIED, FAILED, EXPIRED
    }
}
