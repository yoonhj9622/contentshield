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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    private final AdminService adminService;
    private final UserService userService;
    
    /**
     * 전체 사용자 목록
     */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    /**
     * 사용자 상세 정보
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserDetail(@PathVariable Long userId) {
        User user = userService.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return ResponseEntity.ok(user);
    }
    
    /**
     * 사용자 정지
     */
    @PutMapping("/users/{userId}/suspend")
    public ResponseEntity<?> suspendUser(
        @PathVariable Long userId,
        @RequestBody SuspendRequest request,
        Authentication authentication
    ) {
        Long adminId = getAdminId(authentication);
        
        adminService.suspendUser(userId, adminId, request.getReason(), request.getDays());
        
        return ResponseEntity.ok(Map.of("message", "User suspended"));
    }
    
    /**
     * 사용자 정지 해제
     */
    @PutMapping("/users/{userId}/unsuspend")
    public ResponseEntity<?> unsuspendUser(
        @PathVariable Long userId,
        Authentication authentication
    ) {
        Long adminId = getAdminId(authentication);
        
        adminService.unsuspendUser(userId, adminId);
        
        return ResponseEntity.ok(Map.of("message", "User unsuspended"));
    }
    
    /**
     * 사용자 플래그
     */
    @PutMapping("/users/{userId}/flag")
    public ResponseEntity<?> flagUser(
        @PathVariable Long userId,
        @RequestBody Map<String, String> body,
        Authentication authentication
    ) {
        Long adminId = getAdminId(authentication);
        
        adminService.flagUser(userId, adminId, body.get("reason"));
        
        return ResponseEntity.ok(Map.of("message", "User flagged"));
    }
    
    /**
     * 사용자 플래그 해제
     */
    @PutMapping("/users/{userId}/unflag")
    public ResponseEntity<?> unflagUser(
        @PathVariable Long userId,
        Authentication authentication
    ) {
        Long adminId = getAdminId(authentication);
        
        adminService.unflagUser(userId, adminId);
        
        return ResponseEntity.ok(Map.of("message", "User unflagged"));
    }
    
    /**
     * 관리자 로그 조회
     */
    @GetMapping("/logs/admin")
    public ResponseEntity<List<AdminLog>> getAdminLogs(
        @RequestParam(required = false) Long adminId
    ) {
        return ResponseEntity.ok(adminService.getAdminLogs(adminId));
    }
    
    /**
     * 사용자 활동 로그 조회
     */
    @GetMapping("/logs/activity")
    public ResponseEntity<List<UserActivityLog>> getUserActivityLogs(
        @RequestParam(required = false) Long userId
    ) {
        return ResponseEntity.ok(adminService.getUserActivityLogs(userId));
    }
    
    /**
     * 플래그된 사용자 목록
     */
    @GetMapping("/users/flagged")
    public ResponseEntity<List<User>> getFlaggedUsers() {
        return ResponseEntity.ok(adminService.getFlaggedUsers());
    }
    
    /**
     * 정지된 사용자 목록
     */
    @GetMapping("/users/suspended")
    public ResponseEntity<List<User>> getSuspendedUsers() {
        return ResponseEntity.ok(adminService.getSuspendedUsers());
    }
    
    private Long getAdminId(Authentication authentication) {
        String email = authentication.getName();
        User admin = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        return admin.getUserId();
    }
    
    static class SuspendRequest {
        private String reason;
        private Integer days;
        
        public String getReason() { return reason; }
        public Integer getDays() { return days; }
        
        public void setReason(String reason) { this.reason = reason; }
        public void setDays(Integer days) { this.days = days; }
    }
}