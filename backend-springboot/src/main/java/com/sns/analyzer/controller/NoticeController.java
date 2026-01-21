package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NoticeController {
    
    private final NoticeService noticeService;
    private final UserService userService;
    
    /**
     * 공지사항 목록 (모든 사용자)
     */
    @GetMapping
    public ResponseEntity<List<Notice>> getAllNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }
    
    /**
     * 공지사항 상세
     */
    @GetMapping("/{noticeId}")
    public ResponseEntity<Notice> getNotice(@PathVariable Long noticeId) {
        return ResponseEntity.ok(noticeService.getNotice(noticeId));
    }
    
    /**
     * 공지사항 생성 (관리자만)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createNotice(
        Authentication authentication,
        @RequestBody NoticeRequest request
    ) {
        Long adminId = getAdminId(authentication);
        
        Notice notice = noticeService.createNotice(
            adminId,
            request.getTitle(),
            request.getContent(),
            request.getNoticeType().name()
        );
        
        return ResponseEntity.ok(notice);
    }
    
    /**
     * 공지사항 수정 (관리자만)
     */
    @PutMapping("/{noticeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateNotice(
        @PathVariable Long noticeId,
        @RequestBody NoticeRequest request
    ) {
        Notice updated = noticeService.updateNotice(
            noticeId,
            request.getTitle(),
            request.getContent()
        );
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 공지사항 삭제 (관리자만)
     */
    @DeleteMapping("/{noticeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotice(@PathVariable Long noticeId) {
        noticeService.deleteNotice(noticeId);
        return ResponseEntity.ok(Map.of("message", "Notice deleted"));
    }
    
    /**
     * 공지사항 고정/해제 (관리자만)
     */
    @PutMapping("/{noticeId}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> togglePin(@PathVariable Long noticeId) {
        Notice notice = noticeService.togglePin(noticeId);
        return ResponseEntity.ok(notice);
    }
    
    private Long getAdminId(Authentication authentication) {
        String email = authentication.getName();
        User admin = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        return admin.getUserId();
    }
    
    static class NoticeRequest {
        private String title;
        private String content;
        private Notice.NoticeType noticeType;
        
        public String getTitle() { return title; }
        public String getContent() { return content; }
        public Notice.NoticeType getNoticeType() { return noticeType; }
        
        public void setTitle(String title) { this.title = title; }
        public void setContent(String content) { this.content = content; }
        public void setNoticeType(Notice.NoticeType noticeType) { 
            this.noticeType = noticeType; 
        }
    }
}