package com.sns.analyzer.service;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    
    // Base64 이미지 패턴
    private static final Pattern BASE64_IMAGE_PATTERN = 
        Pattern.compile("^data:image/(png|jpg|jpeg|gif|webp);base64,");
    
    // 최대 이미지 크기 (10MB)
    private static final int MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
    
    /**
     * 사용자 프로필 업데이트 (개선 버전 - 이미지 검증 추가)
     */
    public UserProfile updateProfile(Long userId, UserProfile updatedProfile) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        
        // ==================== 프로필 이미지 검증 ====================
        if (updatedProfile.getProfileImageUrl() != null && 
            !updatedProfile.getProfileImageUrl().isEmpty()) {
            
            String imageData = updatedProfile.getProfileImageUrl();
            
            try {
                // 1. Base64 형식 검증
                if (!BASE64_IMAGE_PATTERN.matcher(imageData).find()) {
                    throw new IllegalArgumentException(
                        "Invalid image format. Must be base64 encoded image (PNG, JPG, JPEG, GIF, WEBP)"
                    );
                }
                
                // 2. Base64 데이터 추출
                String base64Data = imageData.split(",")[1];
                
                // 3. 크기 검증 (Base64 디코딩 후)
                byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
                if (decodedBytes.length > MAX_IMAGE_SIZE_BYTES) {
                    throw new IllegalArgumentException(
                        String.format("Image size exceeds maximum allowed size of %d MB", 
                                    MAX_IMAGE_SIZE_BYTES / (1024 * 1024))
                    );
                }
                
                log.info("Profile image validated successfully for user {}: {} bytes", 
                        userId, decodedBytes.length);
                
                profile.setProfileImageUrl(imageData);
                
            } catch (IllegalArgumentException e) {
                // 검증 실패 시 예외 전파
                log.error("Image validation failed for user {}: {}", userId, e.getMessage());
                throw e;
            } catch (Exception e) {
                // Base64 디코딩 실패 등
                log.error("Image processing failed for user {}: {}", userId, e.getMessage());
                throw new IllegalArgumentException("Failed to process image data", e);
            }
        }
        
        // ==================== 기본 정보 업데이트 ====================
        if (updatedProfile.getFullName() != null) {
            profile.setFullName(updatedProfile.getFullName().trim());
        }
        if (updatedProfile.getPhone() != null) {
            // 전화번호 형식 검증 (선택사항)
            String phone = updatedProfile.getPhone().trim();
            if (!phone.isEmpty() && !isValidPhoneNumber(phone)) {
                throw new IllegalArgumentException("Invalid phone number format");
            }
            profile.setPhone(phone);
        }
        if (updatedProfile.getBio() != null) {
            String bio = updatedProfile.getBio().trim();
            if (bio.length() > 500) {
                throw new IllegalArgumentException("Bio must not exceed 500 characters");
            }
            profile.setBio(bio);
        }
        if (updatedProfile.getCompanyName() != null) {
            profile.setCompanyName(updatedProfile.getCompanyName().trim());
        }
        if (updatedProfile.getLocation() != null) {
            profile.setLocation(updatedProfile.getLocation().trim());
        }
        
        // ==================== 알림 설정 업데이트 ====================
        if (updatedProfile.getEmailNotifications() != null) {
            profile.setEmailNotifications(updatedProfile.getEmailNotifications());
        }
        if (updatedProfile.getSmsNotifications() != null) {
            profile.setSmsNotifications(updatedProfile.getSmsNotifications());
        }
        if (updatedProfile.getMarketingEmails() != null) {
            profile.setMarketingEmails(updatedProfile.getMarketingEmails());
        }
        if (updatedProfile.getMaliciousCommentAlert() != null) {
            profile.setMaliciousCommentAlert(updatedProfile.getMaliciousCommentAlert());
        }
        if (updatedProfile.getAlertSeverity() != null) {
            profile.setAlertSeverity(updatedProfile.getAlertSeverity());
        }
        if (updatedProfile.getSummaryReportEnabled() != null) {
            profile.setSummaryReportEnabled(updatedProfile.getSummaryReportEnabled());
        }
        if (updatedProfile.getNotificationFrequency() != null) {
            profile.setNotificationFrequency(updatedProfile.getNotificationFrequency());
        }
        if (updatedProfile.getReportTime() != null) {
            if (updatedProfile.getReportTime() < 0 || updatedProfile.getReportTime() > 23) {
                throw new IllegalArgumentException("Report time must be between 0 and 23");
            }
            profile.setReportTime(updatedProfile.getReportTime());
        }
        if (updatedProfile.getReportDayOfWeek() != null) {
            if (updatedProfile.getReportDayOfWeek() < 1 || updatedProfile.getReportDayOfWeek() > 7) {
                throw new IllegalArgumentException("Report day of week must be between 1 and 7");
            }
            profile.setReportDayOfWeek(updatedProfile.getReportDayOfWeek());
        }
        if (updatedProfile.getPushNotifications() != null) {
            profile.setPushNotifications(updatedProfile.getPushNotifications());
        }
        if (updatedProfile.getPushToken() != null) {
            profile.setPushToken(updatedProfile.getPushToken());
        }
        
        // ==================== 언어 및 시간대 설정 ====================
        if (updatedProfile.getLanguage() != null) {
            profile.setLanguage(updatedProfile.getLanguage());
        }
        if (updatedProfile.getTimezone() != null) {
            profile.setTimezone(updatedProfile.getTimezone());
        }
        
        profile.setUpdatedAt(LocalDateTime.now());
        
        UserProfile savedProfile = profileRepository.save(profile);
        log.info("Profile updated successfully for user {}", userId);
        
        return savedProfile;
    }
    
    /**
     * 전화번호 형식 검증 (한국 전화번호)
     */
    private boolean isValidPhoneNumber(String phone) {
        // 010-1234-5678, 01012345678, +82-10-1234-5678 등 허용
        String regex = "^(\\+?82[-\\s]?)?0?1[0-9][-\\s]?\\d{3,4}[-\\s]?\\d{4}$";
        return phone.matches(regex);
    }
    
    // ==================== 기존 메서드들 (변경 없음) ====================
    
    public User createUser(String email, String password, String username) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        
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
        createDefaultProfile(savedUser.getUserId());
        createDefaultSubscription(savedUser.getUserId());
        
        return savedUser;
    }
    
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
    
    private void createDefaultSubscription(Long userId) {
        UserSubscription subscription = UserSubscription.builder()
            .userId(userId)
            .planType(UserSubscription.PlanType.FREE)
            .planName("무료 플랜")
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
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }
    
    public Optional<UserProfile> getProfile(Long userId) {
        return profileRepository.findByUserId(userId);
    }
    
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        validatePasswordStrength(newPassword);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
    }
    
    private void validatePasswordStrength(String password) {
        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        
        if (!hasUpper || !hasLower || !hasDigit) {
            throw new IllegalArgumentException("Password must contain uppercase, lowercase, and digits");
        }
    }
    
    public Optional<UserSubscription> getSubscription(Long userId) {
        return subscriptionRepository.findByUserId(userId);
    }
    
    public void updateLastLogin(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<User> getUsersByStatus(User.UserStatus status) {
        return userRepository.findByStatus(status);
    }
    
    public List<User> getUsersByRole(User.UserRole role) {
        return userRepository.findByRole(role);
    }
    
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(User.UserStatus.INACTIVE);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    public void activateUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}