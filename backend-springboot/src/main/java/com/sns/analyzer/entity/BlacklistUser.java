// ==================== BlacklistUser.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blacklist_users")
@Getter @Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class BlacklistUser {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long blacklistId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Long channelId;
    
    @Column(nullable = false, length = 200)
    private String blockedAuthorName;
    
    @Column(nullable = false, length = 200)
    private String blockedAuthorIdentifier;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Platform platform;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer violationCount = 1;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean autoAdded = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer thresholdViolations = 3;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BlacklistStatus status = BlacklistStatus.ACTIVE;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum Platform {
        YOUTUBE, NAVER_BLOG, INSTAGRAM, TIKTOK, TWITTER
    }
    
    public enum BlacklistStatus {
        ACTIVE, INACTIVE, REMOVED
    }
}