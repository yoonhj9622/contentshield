// ==================== CommentReplyRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.CommentReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentReplyRepository extends JpaRepository<CommentReply, Long> {
    List<CommentReply> findByCommentId(Long commentId);
    List<CommentReply> findByUserId(Long userId);
    List<CommentReply> findByUserIdAndIsPosted(Long userId, Boolean isPosted);
    Integer countByCommentId(Long commentId);
}