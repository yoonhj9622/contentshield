// ==================== User.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// #장소영~여기까지: 비밀번호 해시 JSON 노출 방지
import com.fasterxml.jackson.annotation.JsonIgnore;
// #여기까지

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    // #장소영~여기까지: 응답(JSON)에서 passwordHash 제외
    @JsonIgnore
    // #여기까지
    @Column(nullable = false)
    private String passwordHash;

    @Column(length = 50, nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isSuspended = false;

    private LocalDateTime suspendedUntil;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isFlagged = false;

    @Column(columnDefinition = "TEXT")
    private String flagReason;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;

    // 추가: 정지 해제 사유
    private String suspensionReason;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ===== 비즈니스 메소드 추가 =====

    /**
     * 정지 사유 설정
     */
    public void setSuspensionReason(String reason) {
        this.suspensionReason = reason;
    }

    /**
     * 정지 사유 조회
     */
    public String getSuspensionReason() {
        return this.suspensionReason;
    }

    public enum UserRole {
        ADMIN, USER
    }

    public enum UserStatus {
        ACTIVE, INACTIVE, SUSPENDED, DELETED
    }
}
