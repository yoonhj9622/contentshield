// ==================== UserDTO.java ====================
package com.sns.analyzer.dto;

import lombok.*;
import java.time.LocalDateTime;

public class UserDTO {
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserResponse {
        private Long userId;
        private String email;
        private String username;
        private String role;
        private String status;
        private Boolean isSuspended;
        private Boolean isFlagged;
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ProfileUpdateRequest {
        private String fullName;
        private String phone;
        private String bio;
        private String companyName;
        private String location;
        private String profileImageUrl;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProfileResponse {
        private Long profileId;
        private Long userId;
        private String fullName;
        private String phone;
        private String profileImageUrl;
        private String bio;
        private String companyName;
        private String location;
        private String language;
        private String timezone;
        private Boolean emailNotifications;
        private Boolean smsNotifications;
        private Boolean marketingEmails;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SubscriptionResponse {
        private Long subscriptionId;
        private Long userId;
        private String planType;
        private Double monthlyPrice;
        private Integer analysisLimit;
        private Integer channelLimit;
        private Integer apiCallsLimit;
        private Boolean hasAdvancedAnalytics;
        private Boolean hasPrioritySupport;
        private String status;
    }
}