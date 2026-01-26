// ==================== AuthDTO.java ====================
package com.sns.analyzer.dto;

import lombok.*;

public class AuthDTO {
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SignupRequest {
        private String email;
        private String password;
        private String username;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginResponse {
        private String token;
        private Long userId;
        private String email;
        private String username;
        private String role;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class PasswordChangeRequest {
        private String currentPassword;
        private String newPassword;
    }
}