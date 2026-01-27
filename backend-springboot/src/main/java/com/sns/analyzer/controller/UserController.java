package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
// @CrossOrigin(origins = "*")  ← 삭제!
public class UserController {
    
    private final UserService userService;
    
    /**
     * 사용자 계정 정보 조회 (신규 추가)
     */
    @GetMapping("/info")
    public ResponseEntity<?> getUserInfo(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            
            User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("userId", user.getUserId());
            userInfo.put("email", user.getEmail());
            userInfo.put("username", user.getUsername());
            userInfo.put("role", user.getRole().toString());
            userInfo.put("status", user.getStatus().toString());
            userInfo.put("createdAt", user.getCreatedAt());
            userInfo.put("lastLoginAt", user.getLastLoginAt());
            userInfo.put("isSuspended", user.getIsSuspended());
            
            return ResponseEntity.ok(userInfo);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 사용자 프로필 조회
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            
            // 프로필이 없으면 기본 프로필 생성
            UserProfile profile = userService.getProfile(userId)
                .orElseGet(() -> {
                    log.info("Profile not found for user {}, creating default profile", userId);
                    return userService.createDefaultProfileForUser(userId);
                });
            
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Failed to get profile: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 사용자 프로필 수정
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
        Authentication authentication,
        @RequestBody UserProfile profileUpdate
    ) {
        Long userId = getUserIdFromAuth(authentication);
        
        UserProfile updated = userService.updateProfile(userId, profileUpdate);
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 비밀번호 변경
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
        Authentication authentication,
        @RequestBody PasswordChangeRequest request
    ) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            
            userService.changePassword(
                userId,
                request.getCurrentPassword(),
                request.getNewPassword()
            );
            
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 구독 정보 조회
     */
    @GetMapping("/subscription")
    public ResponseEntity<?> getSubscription(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        
        UserSubscription subscription = userService.getSubscription(userId)
            .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        
        return ResponseEntity.ok(subscription);
    }
    
    private Long getUserIdFromAuth(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }
    
    static class PasswordChangeRequest {
        private String currentPassword;
        private String newPassword;
        
        public String getCurrentPassword() { return currentPassword; }
        public String getNewPassword() { return newPassword; }
        
        public void setCurrentPassword(String currentPassword) { 
            this.currentPassword = currentPassword; 
        }
        public void setNewPassword(String newPassword) { 
            this.newPassword = newPassword; 
        }
    }
}