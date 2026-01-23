// ==================== CommentRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostId(Long postId);

    List<Comment> findByUserId(Long userId);

    List<Comment> findByUserIdAndContentUrl(Long userId, String contentUrl);

    List<Comment> findByExternalCommentId(String externalCommentId);

    boolean existsByExternalCommentId(String externalCommentId);

    List<Comment> findByIsAnalyzed(Boolean isAnalyzed);

    List<Comment> findByIsMalicious(Boolean isMalicious);

    List<Comment> findByIsBlacklisted(Boolean isBlacklisted);

    List<Comment> findByAuthorIdentifier(String authorIdentifier);

    Integer countByPostId(Long postId);

    Integer countByPostIdAndIsMalicious(Long postId, Boolean isMalicious);
}