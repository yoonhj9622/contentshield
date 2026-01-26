// ==================== UserActivityLog.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_activity_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserActivityLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long activityId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false, length = 50)
    private String activityType;
    
    @Column(length = 50)
    private String targetType;
    
    private Long targetId;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 45)
    private String ipAddress;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}