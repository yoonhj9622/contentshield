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

    // #장소영~여기까지: String -> Enum으로 수정 (엔티티와 타입 맞추기)
    List<AdminLog> findByActionType(AdminLog.ActionType actionType);
    // #여기까지

    // (이 부분은 엔티티의 타입이 String이면 OK. 만약 TargetType도 Enum이면 여기도 바꿔야 함)
    List<AdminLog> findByTargetTypeAndTargetId(String targetType, Long targetId);

    List<AdminLog> findByCreatedAtAfter(LocalDateTime after);

    List<AdminLog> findByAdminIdAndCreatedAtBetween(Long adminId, LocalDateTime start, LocalDateTime end);
}
