package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime; // #장소영~여기까지: DTO 필드 타입용
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors; // #장소영~여기까지: DTO 변환용

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
// #장소영~여기까지: allowCredentials=true 환경에서 @CrossOrigin(origins="*")는 Spring이 예외 던져서 500 발생
// → 컨트롤러 CORS는 제거하고, SecurityConfig의 CORS 설정만 사용하도록 통일
// @CrossOrigin(origins = "*")
// #여기까지
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    // ==================== #장소영~여기까지: AdminUserDto 추가 (User 엔티티 직접 반환으로 인한 500 방지) ====================
    static class AdminUserDto {
        public Long userId;
        public String email;
        public String username;
        public User.UserRole role;
        public User.UserStatus status;
        public Boolean isSuspended;
        public LocalDateTime suspendedUntil;
        public String suspensionReason;
        public Boolean isFlagged;
        public String flagReason;
        public LocalDateTime createdAt;
        public LocalDateTime updatedAt;
        public LocalDateTime lastLoginAt;

        public static AdminUserDto from(User u) {
            AdminUserDto dto = new AdminUserDto();
            dto.userId = u.getUserId();
            dto.email = u.getEmail();
            dto.username = u.getUsername();
            dto.role = u.getRole();
            dto.status = u.getStatus();
            dto.isSuspended = u.getIsSuspended();
            dto.suspendedUntil = u.getSuspendedUntil();
            dto.suspensionReason = u.getSuspensionReason();
            dto.isFlagged = u.getIsFlagged();
            dto.flagReason = u.getFlagReason();
            dto.createdAt = u.getCreatedAt();
            dto.updatedAt = u.getUpdatedAt();
            dto.lastLoginAt = u.getLastLoginAt();
            return dto;
        }
    }
    // ==================== #여기까지 ====================

    /**
     * 전체 사용자 목록
     */
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getAllUsers() {
        // #장소영~여기까지: User 엔티티 직접 반환 -> DTO로 변환해서 반환 (500 방지 + 비밀번호 해시 노출 방지)
        List<AdminUserDto> result = userService.getAllUsers().stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
        // #여기까지
    }

    /**
     * 사용자 상세 정보
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserDetail(@PathVariable Long userId) {
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // #장소영~여기까지: 상세도 엔티티 대신 DTO로 반환
        return ResponseEntity.ok(AdminUserDto.from(user));
        // #여기까지
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
    public ResponseEntity<List<AdminUserDto>> getFlaggedUsers() {
        // #장소영~여기까지: 엔티티 반환 -> DTO 반환
        List<AdminUserDto> result = adminService.getFlaggedUsers().stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
        // #여기까지
    }

    /**
     * 정지된 사용자 목록
     */
    @GetMapping("/users/suspended")
    public ResponseEntity<List<AdminUserDto>> getSuspendedUsers() {
        // #장소영~여기까지: 엔티티 반환 -> DTO 반환
        List<AdminUserDto> result = adminService.getSuspendedUsers().stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
        // #여기까지
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

    // ==================== AdminController.java (추가->통계랑 로그) 장소영====================

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/dashboard/recent-logs")
    public ResponseEntity<?> getRecentLogs(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminService.getRecentAdminLogs(limit));
    }
}
