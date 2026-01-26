// ==================== AnalysisStatsRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.AnalysisStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

@Repository
public interface AnalysisStatsRepository extends JpaRepository<AnalysisStats, Long> {
    Optional<AnalysisStats> findByUserIdAndStatDate(Long userId, LocalDate statDate);
    List<AnalysisStats> findByUserId(Long userId);
    List<AnalysisStats> findByUserIdAndStatDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
    List<AnalysisStats> findByChannelId(Long channelId);
    
    @Query("SELECT SUM(a.totalComments) FROM AnalysisStats a WHERE a.userId = :userId")
    Integer getTotalCommentsByUserId(Long userId);
}