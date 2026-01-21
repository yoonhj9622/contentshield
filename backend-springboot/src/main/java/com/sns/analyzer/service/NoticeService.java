// ==================== NoticeService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.Notice;
import com.sns.analyzer.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NoticeService {
    
    private final NoticeRepository noticeRepository;
    
    public Notice createNotice(Long adminId, String title, String content, String noticeType) {
        Notice notice = Notice.builder()
            .adminId(adminId)
            .title(title)
            .content(content)
            .noticeType(Notice.NoticeType.valueOf(noticeType))
            .build();
        
        return noticeRepository.save(notice);
    }
    
    @Transactional(readOnly = true)
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc();
    }
    
    @Transactional
    public Notice getNotice(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
            .orElseThrow(() -> new IllegalArgumentException("Notice not found"));
        
        // 조회수 증가
        noticeRepository.incrementViewCount(noticeId);
        
        return notice;
    }
    
    public Notice updateNotice(Long noticeId, String title, String content) {
        Notice notice = noticeRepository.findById(noticeId)
            .orElseThrow(() -> new IllegalArgumentException("Notice not found"));
        
        if (title != null) notice.setTitle(title);
        if (content != null) notice.setContent(content);
        
        return noticeRepository.save(notice);
    }
    
    public void deleteNotice(Long noticeId) {
        noticeRepository.deleteById(noticeId);
    }
    
    public Notice togglePin(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
            .orElseThrow(() -> new IllegalArgumentException("Notice not found"));
        
        notice.setIsPinned(!notice.getIsPinned());
        return noticeRepository.save(notice);
    }
}