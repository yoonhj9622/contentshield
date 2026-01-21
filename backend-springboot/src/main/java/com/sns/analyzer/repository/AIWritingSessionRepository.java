// ==================== AIWritingSessionRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.AIWritingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AIWritingSessionRepository extends JpaRepository<AIWritingSession, Long> {
    List<AIWritingSession> findByUserId(Long userId);
    List<AIWritingSession> findByUserIdAndWasAccepted(Long userId, Boolean wasAccepted);
    List<AIWritingSession> findByImprovementType(String improvementType);
    Integer countByUserId(Long userId);
}