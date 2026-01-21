// ==================== BlockedWordRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.BlockedWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BlockedWordRepository extends JpaRepository<BlockedWord, Long> {
    List<BlockedWord> findByUserId(Long userId);
    List<BlockedWord> findByUserIdAndIsActive(Long userId, Boolean isActive);
    List<BlockedWord> findByCategory(BlockedWord.WordCategory category);
    List<BlockedWord> findBySeverity(BlockedWord.Severity severity);
    Boolean existsByUserIdAndWord(Long userId, String word);
}