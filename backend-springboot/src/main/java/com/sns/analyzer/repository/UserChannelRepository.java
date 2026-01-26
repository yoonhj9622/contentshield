// ==================== UserChannelRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.UserChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserChannelRepository extends JpaRepository<UserChannel, Long> {
    List<UserChannel> findByUserId(Long userId);
    List<UserChannel> findByUserIdAndIsActive(Long userId, Boolean isActive);
    List<UserChannel> findByPlatform(UserChannel.Platform platform);
    Optional<UserChannel> findByChannelIdentifier(String channelIdentifier);
    List<UserChannel> findByVerificationStatus(UserChannel.VerificationStatus status);
    Integer countByUserId(Long userId);
}