// ==================== UserSubscriptionRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    Optional<UserSubscription> findByUserId(Long userId);

    List<UserSubscription> findByPlanType(UserSubscription.PlanType planType);

    List<UserSubscription> findByStatus(UserSubscription.SubscriptionStatus status);

    // #장소영~여기까지: LocalDate -> LocalDateTime으로 수정 (엔티티 필드 타입과 일치)
    List<UserSubscription> findByEndDateBefore(LocalDateTime dateTime);

    List<UserSubscription> findByAutoRenewAndNextPaymentDateBefore(Boolean autoRenew, LocalDateTime dateTime);
    // #여기까지
}
