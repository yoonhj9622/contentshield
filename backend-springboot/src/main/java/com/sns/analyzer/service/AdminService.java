// ==================== AdminService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {
    
    private final UserRepository userRepository;
    private final AdminLogRepository adminLogRepository;
    private final UserActivityLogRepository userActivityLogRepository;
    
    /**
     * 사용자 정지
     */
    public void suspendUser(Long userId, Long adminId, String reason, Integer days) {
        if (userId == null || adminId == null || days == null) {
        throw new IllegalArgumentException("Required parameters cannot be null");
    }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setIsSuspended(true);
        user.setSuspendedUntil(LocalDateTime.now().plusDays(days));
        user.setSuspensionReason(reason);
        user.setStatus(User.UserStatus.SUSPENDED);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        // 관리자 로그 기록 - String 대신 Enum 사용
        logAdminAction(adminId, AdminLog.ActionType.SUSPEND_USER, "User", userId, 
            String.format("Suspended user for %d days. Reason: %s", days, reason));
    }
    
    /**
     * 사용자 정지 해제
     */
    public void unsuspendUser(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setIsSuspended(false);
        user.setSuspendedUntil(null);
        user.setSuspensionReason(null);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        // Enum 사용
        logAdminAction(adminId, AdminLog.ActionType.UNSUSPEND_USER, "User", userId, "Unsuspended user");
    }
    
    /**
     * 사용자 플래그 설정
     */
    public void flagUser(Long userId, Long adminId, String reason) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setIsFlagged(true);
        user.setFlagReason(reason);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        logAdminAction(adminId, AdminLog.ActionType.FLAG_USER, "User", userId, "Flagged user: " + reason);
    }
    
    /**
     * 사용자 플래그 해제
     */
    public void unflagUser(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setIsFlagged(false);
        user.setFlagReason(null);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        logAdminAction(adminId, AdminLog.ActionType.UNFLAG_USER, "User", userId, "Unflagged user");
    }
    
    /**
     * 관리자 액션 로그 기록
     * ⭐ actionType 파라미터를 String에서 AdminLog.ActionType Enum으로 변경
     */
    private void logAdminAction(Long adminId, AdminLog.ActionType actionType, String targetType, 
                                Long targetId, String description) {
        AdminLog log = AdminLog.builder()
            .adminId(adminId)
            .actionType(actionType)  // ✅ Enum 직접 사용
            .targetType(targetType)
            .targetId(targetId)
            .description(description)
            .createdAt(LocalDateTime.now())
            .build();
        
        adminLogRepository.save(log);
    }
    
    /**
     * 관리자 로그 조회
     */
    public List<AdminLog> getAdminLogs(Long adminId) {
        if (adminId != null) {
            return adminLogRepository.findByAdminId(adminId);
        }
        return adminLogRepository.findAll();
    }
    
    /**
     * 사용자 활동 로그 조회
     */
    public List<UserActivityLog> getUserActivityLogs(Long userId) {
        if (userId != null) {
            return userActivityLogRepository.findByUserId(userId);
        }
        return userActivityLogRepository.findAll();
    }
    
    /**
     * 플래그된 사용자 목록
     */
    public List<User> getFlaggedUsers() {
        return userRepository.findByIsFlagged(true);
    }
    
    /**
     * 정지된 사용자 목록
     */
    public List<User> getSuspendedUsers() {
        return userRepository.findByIsSuspended(true);
    }
}