// ==================== UserSubscription.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long subscriptionId;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PlanType planType = PlanType.FREE;

    @Column(length = 50)
    private String planName;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal monthlyPrice = BigDecimal.ZERO;

    // 분석 한도
    @Column(nullable = false)
    @Builder.Default
    private Integer analysisLimit = 100;

    @Column(nullable = false)
    @Builder.Default
    private Integer usedAnalysisCount = 0;

    // 채널 한도
    @Column(nullable = false)
    @Builder.Default
    private Integer channelLimit = 1;

    // API 호출 한도
    @Column(nullable = false)
    @Builder.Default
    private Integer apiCallsLimit = 1000;

    // 고급 기능
    @Column(nullable = false)
    @Builder.Default
    private Boolean hasAdvancedAnalytics = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasPrioritySupport = false;

    // 구독 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime startDate = LocalDateTime.now().withNano(0);

    private LocalDateTime endDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean autoRenew = true;

    // 결제 정보
    @Column(length = 50)
    private String paymentMethod;

    private LocalDateTime lastPaymentDate;
    private LocalDateTime nextPaymentDate;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now().withNano(0);

    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Enums
    public enum PlanType {
        FREE, BASIC, PRO, ENTERPRISE
    }

    public enum SubscriptionStatus {
        ACTIVE, CANCELLED, EXPIRED, SUSPENDED
    }

    // Business Methods
    public boolean canAnalyze() {
        return status == SubscriptionStatus.ACTIVE && usedAnalysisCount < analysisLimit;
    }

    public void incrementUsage() {
        this.usedAnalysisCount++;
    }

    public void resetMonthlyUsage() {
        this.usedAnalysisCount = 0;
    }
}
