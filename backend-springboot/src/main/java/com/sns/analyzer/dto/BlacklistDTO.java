// ==================== BlacklistDTO.java ====================
package com.sns.analyzer.dto;

import lombok.*;
import java.time.LocalDateTime;

public class BlacklistDTO {
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class BlacklistAddRequest {
        private Long channelId;
        private String blockedAuthorName;
        private String blockedAuthorIdentifier;
        private String platform;
        private String reason;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BlacklistResponse {
        private Long blacklistId;
        private Long userId;
        private Long channelId;
        private String blockedAuthorName;
        private String blockedAuthorIdentifier;
        private String platform;
        private String reason;
        private Integer violationCount;
        private Boolean autoAdded;
        private String status;
        private LocalDateTime createdAt;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class BlacklistUpdateRequest {
        private String reason;
        private String status;
    }
}
