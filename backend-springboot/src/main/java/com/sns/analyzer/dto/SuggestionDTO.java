// ==================== SuggestionDTO.java ====================
package com.sns.analyzer.dto;

import lombok.*;
import java.time.LocalDateTime;

public class SuggestionDTO {
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SuggestionCreateRequest {
        private String title;
        private String content;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SuggestionResponse {
        private Long suggestionId;
        private Long userId;
        private String title;
        private String content;
        private String status;
        private String adminResponse;
        private Long respondedBy;
        private LocalDateTime respondedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SuggestionUpdateRequest {
        private String status;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SuggestionResponseRequest {
        private String response;
    }
}