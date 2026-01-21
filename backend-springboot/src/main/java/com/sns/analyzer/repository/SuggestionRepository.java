// ==================== SuggestionRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.Suggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {
    List<Suggestion> findByUserId(Long userId);
    List<Suggestion> findByStatus(Suggestion.SuggestionStatus status);
    List<Suggestion> findByUserIdAndStatus(Long userId, Suggestion.SuggestionStatus status);
    Integer countByStatus(Suggestion.SuggestionStatus status);
}