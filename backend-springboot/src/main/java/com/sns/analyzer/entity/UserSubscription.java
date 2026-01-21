// ==================== UserSubscription.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_subscriptions")
@Getter @Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class UserSubscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long subscriptionId;
    
    @Column(nullable = false, unique = true)
    private Long userId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PlanType planType = PlanType.FREE;
    
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal monthlyPrice = BigDecimal.ZERO;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer analysisLimit = 100;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer channelLimit = 1;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer apiCallsLimit = 1000;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean hasAdvancedAnalytics = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean hasPrioritySupport = false;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean autoRenew = true;
    
    @Column(length = 100)
    private String paymentMethod;
    
    private LocalDateTime lastPaymentDate;
    
    private LocalDateTime nextPaymentDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum PlanType {
        FREE, BASIC, PRO, ENTERPRISE
    }
    
    public enum SubscriptionStatus {
        ACTIVE, CANCELLED, EXPIRED, SUSPENDED
    }
}