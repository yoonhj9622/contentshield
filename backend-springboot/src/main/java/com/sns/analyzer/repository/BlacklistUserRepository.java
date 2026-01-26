// ==================== BlacklistUserRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.BlacklistUser;
import com.sns.analyzer.entity.BlacklistUser.BlacklistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BlacklistUserRepository extends JpaRepository<BlacklistUser, Long> {
    
    // 사용자별 블랙리스트 조회
    List<BlacklistUser> findByUserId(Long userId);
    
    // 사용자별 활성화된 블랙리스트 조회
    List<BlacklistUser> findByUserIdAndStatus(Long userId, BlacklistStatus status);
    
    // 특정 작성자가 블랙리스트에 있는지 확인
    Optional<BlacklistUser> findByUserIdAndBlockedAuthorIdentifierAndStatus(
            Long userId, String blockedAuthorIdentifier, BlacklistStatus status);
    
    // 중복 체크
    Boolean existsByUserIdAndBlockedAuthorIdentifierAndPlatformAndStatus(
            Long userId, String blockedAuthorIdentifier, String platform, BlacklistStatus status);

    // 중복 체크
    Boolean existsByUserIdAndBlockedAuthorIdentifier(Long userId, String blockedAuthorIdentifier);

// 특정 작성자 조회
    Optional<BlacklistUser> findByUserIdAndBlockedAuthorIdentifier(Long userId, String blockedAuthorIdentifier);
}