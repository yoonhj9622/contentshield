package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AdminLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;
    
    @Column(nullable = false)
    private Long adminId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType actionType;
    
    @Column(length = 100)
    private String targetType;
    
    private Long targetId;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 100)
    private String ipAddress;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // ⭐ 이 enum이 꼭 있어야 합니다!
    public enum ActionType {
        SUSPEND_USER, UNSUSPEND_USER, FLAG_USER, UNFLAG_USER,
        CREATE_NOTICE, UPDATE_NOTICE, DELETE_NOTICE,
        RESPOND_SUGGESTION, UPDATE_USER, DELETE_USER
    }
}