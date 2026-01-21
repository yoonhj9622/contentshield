// ==================== AnalysisResultRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    Optional<AnalysisResult> findByCommentId(Long commentId);
    List<AnalysisResult> findByUserId(Long userId);
    List<AnalysisResult> findByUserIdAndAnalyzedAtAfter(Long userId, LocalDateTime after);
    List<AnalysisResult> findByCategory(String category);
    
    @Query("SELECT AVG(a.toxicityScore) FROM AnalysisResult a WHERE a.userId = :userId")
    Double getAverageToxicityScoreByUserId(Long userId);
    
    Integer countByUserId(Long userId);
}