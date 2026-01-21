// ==================== SocialPostRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.SocialPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface SocialPostRepository extends JpaRepository<SocialPost, Long> {
    List<SocialPost> findByChannelId(Long channelId);
    Optional<SocialPost> findByExternalPostId(String externalPostId);
    List<SocialPost> findByChannelIdAndPublishedAtAfter(Long channelId, LocalDateTime after);
    Integer countByChannelId(Long channelId);
}
