// ==================== SocialPost.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "social_posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SocialPost {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long postId;
    
    @Column(nullable = false)
    private Long channelId;
    
    @Column(nullable = false, length = 200)
    private String externalPostId;
    
    @Column(nullable = false, length = 500)
    private String postUrl;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String postContent;
    
    @Column(nullable = false)
    private LocalDateTime publishedAt;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer viewCount = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer likeCount = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer commentCount = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer shareCount = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}