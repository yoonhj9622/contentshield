// ==================== UserProfile.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long profileId;
    
    @Column(nullable = false, unique = true)
    private Long userId;
    
    @Column(length = 100)
    private String fullName;
    
    @Column(length = 20)
    private String phone;
    
    @Column(length = 255)
    private String profileImageUrl;
    
    @Column(columnDefinition = "TEXT")
    private String bio;
    
    @Column(length = 100)
    private String companyName;
    
    @Column(length = 50)
    private String location;
    
    @Column(length = 10)
    @Builder.Default
    private String language = "ko";
    
    @Column(length = 50)
    @Builder.Default
    private String timezone = "Asia/Seoul";
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean emailNotifications = true;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean smsNotifications = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean marketingEmails = false;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}