// ==================== UserSubscriptionRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.time.LocalDate;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findByUserId(Long userId);
    List<UserSubscription> findByPlanType(UserSubscription.PlanType planType);
    List<UserSubscription> findByStatus(UserSubscription.SubscriptionStatus status);
    List<UserSubscription> findByEndDateBefore(LocalDate date);
    List<UserSubscription> findByAutoRenewAndNextPaymentDateBefore(Boolean autoRenew, LocalDate date);
}