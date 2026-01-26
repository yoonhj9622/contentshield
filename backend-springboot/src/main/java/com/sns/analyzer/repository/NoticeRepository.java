// ==================== NoticeRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findByIsPinned(Boolean isPinned);
    List<Notice> findByNoticeType(Notice.NoticeType noticeType);
    List<Notice> findAllByOrderByIsPinnedDescCreatedAtDesc();
    
    @Modifying
    @Query("UPDATE Notice n SET n.viewCount = n.viewCount + 1 WHERE n.noticeId = :noticeId")
    void incrementViewCount(Long noticeId);
}
