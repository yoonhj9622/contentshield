// ==================== BlockedWordRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.BlockedWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BlockedWordRepository extends JpaRepository<BlockedWord, Long> {
    
    // 사용자별 차단 단어 조회
    List<BlockedWord> findByUserId(Long userId);
    
    // 사용자별 활성화된 차단 단어 조회
    List<BlockedWord> findByUserIdAndIsActive(Long userId, Boolean isActive);
    
    // 사용자별 + 카테고리별 조회
    List<BlockedWord> findByUserIdAndCategory(Long userId, BlockedWord.WordCategory category);
    
    // 중복 체크
    Boolean existsByUserIdAndWord(Long userId, String word);
    
    // 전역 차단 단어 (userId가 null인 경우)
    List<BlockedWord> findByUserIdIsNullAndIsActive(Boolean isActive);
}