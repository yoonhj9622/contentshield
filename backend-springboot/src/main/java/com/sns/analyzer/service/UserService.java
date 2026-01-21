// ==================== UserService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 사용자 생성 (회원가입)
     */
    public User createUser(String email, String password, String username) {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        // 사용자 생성
        User user = User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(password))
            .username(username)
            .role(User.UserRole.USER)
            .status(User.UserStatus.ACTIVE)
            .isSuspended(false)
            .isFlagged(false)
            .createdAt(LocalDateTime.now())
            .build();
        
        User savedUser = userRepository.save(user);
        
        // 프로필 자동 생성
        createDefaultProfile(savedUser.getUserId());
        
        // 기본 구독 (무료) 생성
        createDefaultSubscription(savedUser.getUserId());
        
        return savedUser;
    }
    
    /**
     * 기본 프로필 생성
     */
    private void createDefaultProfile(Long userId) {
        UserProfile profile = UserProfile.builder()
            .userId(userId)
            .language("ko")
            .timezone("Asia/Seoul")
            .emailNotifications(true)
            .smsNotifications(false)
            .marketingEmails(false)
            .createdAt(LocalDateTime.now())
            .build();
        
        profileRepository.save(profile);
    }
    
    /**
     * 기본 구독 생성 (무료 플랜)
     */
    private void createDefaultSubscription(Long userId) {
        UserSubscription subscription = UserSubscription.builder()
            .userId(userId)
            .planType(UserSubscription.PlanType.FREE)
            .monthlyPrice(java.math.BigDecimal.ZERO)
            .analysisLimit(100)
            .channelLimit(1)
            .apiCallsLimit(1000)
            .hasAdvancedAnalytics(false)
            .hasPrioritySupport(false)
            .autoRenew(true)
            .status(UserSubscription.SubscriptionStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();
        
        subscriptionRepository.save(subscription);
    }
    
    /**
     * 이메일로 사용자 조회
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * 사용자 ID로 조회
     */
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }
    
    /**
     * 사용자 프로필 조회
     */
    public Optional<UserProfile> getProfile(Long userId) {
        return profileRepository.findByUserId(userId);
    }
    
    /**
     * 사용자 프로필 업데이트
     */
    public UserProfile updateProfile(Long userId, UserProfile updatedProfile) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        
        // 업데이트
        if (updatedProfile.getFullName() != null) {
            profile.setFullName(updatedProfile.getFullName());
        }
        if (updatedProfile.getPhone() != null) {
            profile.setPhone(updatedProfile.getPhone());
        }
        if (updatedProfile.getBio() != null) {
            profile.setBio(updatedProfile.getBio());
        }
        if (updatedProfile.getCompanyName() != null) {
            profile.setCompanyName(updatedProfile.getCompanyName());
        }
        if (updatedProfile.getLocation() != null) {
            profile.setLocation(updatedProfile.getLocation());
        }
        
        profile.setUpdatedAt(LocalDateTime.now());
        
        return profileRepository.save(profile);
    }
    
    /**
     * 비밀번호 변경
     */
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // 새 비밀번호 설정
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
    }
    
    /**
     * 사용자 구독 정보 조회
     */
    public Optional<UserSubscription> getSubscription(Long userId) {
        return subscriptionRepository.findByUserId(userId);
    }
    
    /**
     * 마지막 로그인 시간 업데이트
     */
    public void updateLastLogin(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    /**
     * 모든 사용자 조회
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    /**
     * 상태별 사용자 조회
     */
    public List<User> getUsersByStatus(User.UserStatus status) {
        return userRepository.findByStatus(status);
    }
}