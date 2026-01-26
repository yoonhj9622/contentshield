// ==================== UserActivityLogRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.UserActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, Long> {
    List<UserActivityLog> findByUserId(Long userId);
    List<UserActivityLog> findByActivityType(String activityType);
    List<UserActivityLog> findByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);
    List<UserActivityLog> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);
    Integer countByUserId(Long userId);
}
