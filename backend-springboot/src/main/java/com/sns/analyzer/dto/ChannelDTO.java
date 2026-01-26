// ==================== ChannelDTO.java ====================
package com.sns.analyzer.dto;

import lombok.*;
import java.time.LocalDateTime;

public class ChannelDTO {
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ChannelCreateRequest {
        private String platform;
        private String channelName;
        private String channelUrl;
        private String channelIdentifier;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChannelResponse {
        private Long channelId;
        private Long userId;
        private String platform;
        private String channelName;
        private String channelUrl;
        private String channelIdentifier;
        private String verificationStatus;
        private Integer totalPosts;
        private Integer totalComments;
        private Integer analyzedComments;
        private Integer blockedComments;
        private Boolean isActive;
        private LocalDateTime verifiedAt;
        private LocalDateTime lastSyncedAt;
        private LocalDateTime createdAt;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ChannelUpdateRequest {
        private String channelName;
        private String channelUrl;
        private Boolean isActive;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ChannelStatsUpdateRequest {
        private Integer totalPosts;
        private Integer totalComments;
    }
}
