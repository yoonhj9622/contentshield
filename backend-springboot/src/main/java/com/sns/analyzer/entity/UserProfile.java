package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long profileId;
    
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;
    
    // ==================== 기본 프로필 정보 ====================
    
    @Column(name = "full_name", length = 100)
    private String fullName;
    
    @Column(name = "phone", length = 20)
    private String phone;
    
    // ✅ MEDIUMTEXT로 변경 (Base64 이미지 저장)
    @Lob  // Large Object로 선언
    @Column(name = "profile_image_url", columnDefinition = "MEDIUMTEXT")
    private String profileImageUrl;
    
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    
    @Column(name = "company_name", length = 100)
    private String companyName;
    
    @Column(name = "business_number", length = 50)
    private String businessNumber;
    
    @Column(name = "location", length = 100)
    private String location;
    
    // ==================== 알림 설정 ====================
    
    @Column(name = "email_notifications", nullable = false)
    @Builder.Default
    private Boolean emailNotifications = true;
    
    @Column(name = "sms_notifications", nullable = false)
    @Builder.Default
    private Boolean smsNotifications = false;
    
    @Column(name = "marketing_emails", nullable = false)
    @Builder.Default
    private Boolean marketingEmails = false;
    
    // ==================== 악성 댓글 알림 설정 (추가) ====================
    
    @Column(name = "malicious_comment_alert", nullable = false)
    @Builder.Default
    private Boolean maliciousCommentAlert = true;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "alert_severity")
    @Builder.Default
    private AlertSeverity alertSeverity = AlertSeverity.HIGH;
    
    @Column(name = "summary_report_enabled", nullable = false)
    @Builder.Default
    private Boolean summaryReportEnabled = true;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_frequency")
    @Builder.Default
    private NotificationFrequency notificationFrequency = NotificationFrequency.REALTIME;
    
    @Column(name = "report_time")
    @Builder.Default
    private Integer reportTime = 9;  // 9시
    
    @Column(name = "report_day_of_week")
    @Builder.Default
    private Integer reportDayOfWeek = 1;  // 월요일
    
    @Column(name = "push_notifications", nullable = false)
    @Builder.Default
    private Boolean pushNotifications = false;
    
    @Column(name = "push_token", columnDefinition = "TEXT")
    private String pushToken;
    
    // ==================== 언어 및 시간대 설정 ====================
    
    @Column(name = "language", length = 10)
    @Builder.Default
    private String language = "ko";
    
    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "Asia/Seoul";
    
    // ==================== 타임스탬프 ====================
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // ==================== 열거형 정의 ====================
    
    public enum AlertSeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
    
    public enum NotificationFrequency {
        REALTIME, HOURLY, DAILY, WEEKLY
    }
    
    // ==================== JPA 라이프사이클 콜백 ====================
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}