// ==================== CommentRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
        List<Comment> findByPostId(Long postId);

        List<Comment> findByUserId(Long userId);

        void deleteByUserId(Long userId);

        List<Comment> findByUserIdAndContentUrl(Long userId, String contentUrl);

        List<Comment> findByExternalCommentId(String externalCommentId);

        boolean existsByExternalCommentId(String externalCommentId);

        boolean existsByUserIdAndExternalCommentId(Long userId, String externalCommentId);

        List<Comment> findByIsAnalyzed(Boolean isAnalyzed);

        List<Comment> findByIsMalicious(Boolean isMalicious);

        List<Comment> findByIsBlacklisted(Boolean isBlacklisted);

        List<Comment> findByAuthorIdentifier(String authorIdentifier);

        // 기간 필터링 조회 추가 (Pageable 지원)
        Page<Comment> findByUserIdAndCommentedAtBetween(Long userId, java.time.LocalDateTime start,
                        java.time.LocalDateTime end, Pageable pageable);

        Page<Comment> findByUserIdAndContentUrlAndCommentedAtBetween(Long userId, String url,
                        java.time.LocalDateTime start, java.time.LocalDateTime end, Pageable pageable);

        void deleteByUserIdAndContentUrlAndCommentedAtBetween(Long userId, String contentUrl,
                        java.time.LocalDateTime start, java.time.LocalDateTime end);

        void deleteByUserIdAndContentUrl(Long userId, String contentUrl);

        Integer countByPostId(Long postId);

        Integer countByPostIdAndIsMalicious(Long postId, Boolean isMalicious);

        // 상태 필터링 조회 추가 (Pageable 지원)
        Page<Comment> findByUserIdAndIsMaliciousAndCommentedAtBetween(Long userId, Boolean isMalicious,
                        java.time.LocalDateTime start, java.time.LocalDateTime end, Pageable pageable);

        Page<Comment> findByUserIdAndContentUrlAndIsMaliciousAndCommentedAtBetween(Long userId, String url,
                        Boolean isMalicious, java.time.LocalDateTime start, java.time.LocalDateTime end,
                        Pageable pageable);
}