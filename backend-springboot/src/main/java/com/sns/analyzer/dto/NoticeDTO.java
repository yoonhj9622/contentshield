// ==================== NoticeDTO.java ====================
package com.sns.analyzer.dto;

import lombok.*;
import java.time.LocalDateTime;

public class NoticeDTO {
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class NoticeCreateRequest {
        private String title;
        private String content;
        private String noticeType;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class NoticeResponse {
        private Long noticeId;
        private Long adminId;
        private String title;
        private String content;
        private String noticeType;
        private Boolean isPinned;
        private Integer viewCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class NoticeUpdateRequest {
        private String title;
        private String content;
        private String noticeType;
        private Boolean isPinned;
    }
}