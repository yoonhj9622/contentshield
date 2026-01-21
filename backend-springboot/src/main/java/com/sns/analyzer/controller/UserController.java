package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    
    /**
     * 사용자 프로필 조회
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        
        UserProfile profile = userService.getProfile(userId)
            .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        
        return ResponseEntity.ok(profile);
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