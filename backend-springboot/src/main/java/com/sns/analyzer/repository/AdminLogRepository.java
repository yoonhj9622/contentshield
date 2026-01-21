// ==================== AdminLogRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.AdminLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {
    List<AdminLog> findByAdminId(Long adminId);
    List<AdminLog> findByActionType(String actionType);
    List<AdminLog> findByTargetTypeAndTargetId(String targetType, Long targetId);
    List<AdminLog> findByCreatedAtAfter(LocalDateTime after);
    List<AdminLog> findByAdminIdAndCreatedAtBetween(Long adminId, LocalDateTime start, LocalDateTime end);
}