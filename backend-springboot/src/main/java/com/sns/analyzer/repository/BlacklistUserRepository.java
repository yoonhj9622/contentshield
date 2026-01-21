// ==================== BlacklistUserRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.BlacklistUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BlacklistUserRepository extends JpaRepository<BlacklistUser, Long> {
    List<BlacklistUser> findByUserId(Long userId);
    List<BlacklistUser> findByUserIdAndStatus(Long userId, BlacklistUser.BlacklistStatus status);
    List<BlacklistUser> findByChannelId(Long channelId);
    Optional<BlacklistUser> findByUserIdAndBlockedAuthorIdentifier(Long userId, String authorIdentifier);
    List<BlacklistUser> findByAutoAdded(Boolean autoAdded);
    Boolean existsByUserIdAndBlockedAuthorIdentifier(Long userId, String authorIdentifier);
}