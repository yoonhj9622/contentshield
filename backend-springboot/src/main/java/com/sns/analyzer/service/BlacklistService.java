// ==================== BlacklistService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.BlacklistUser;
import com.sns.analyzer.entity.BlacklistUser.Platform;
import com.sns.analyzer.entity.BlacklistUser.BlacklistStatus;
import com.sns.analyzer.repository.BlacklistUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BlacklistService {
    
    private final BlacklistUserRepository blacklistRepository;
    
    /**
     * 블랙리스트 추가
     */
    public BlacklistUser addToBlacklist(Long userId, Long channelId, 
                                       String authorName, String authorIdentifier,
                                       Platform platform, String reason, String commentText) {
        // 이미 블랙리스트에 있는지 확인
        if (blacklistRepository.existsByUserIdAndBlockedAuthorIdentifier(userId, authorIdentifier)) {
            throw new IllegalArgumentException("Author already in blacklist");
        }
        
        BlacklistUser blacklistUser = BlacklistUser.builder()
            .userId(userId)
            .channelId(channelId)
            .blockedAuthorName(authorName)
            .blockedAuthorIdentifier(authorIdentifier)
            .platform(platform)
            .reason(reason)
            .commentText(commentText)
            .violationCount(1)
            .autoAdded(false)
            .thresholdViolations(3)
            .status(BlacklistStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();
        
        return blacklistRepository.save(blacklistUser);
    }
    
    /**
     * 자동 블랙리스트 추가 (위반 횟수 기반)
     */
    public BlacklistUser autoAddToBlacklist(Long userId, Long channelId,
                                           String authorName, String authorIdentifier,
                                           Platform platform, Integer violationCount, String commentText) {
        BlacklistUser blacklistUser = BlacklistUser.builder()
            .userId(userId)
            .channelId(channelId)
            .blockedAuthorName(authorName)
            .blockedAuthorIdentifier(authorIdentifier)
            .platform(platform)
            .reason("Auto-added: " + violationCount + " violations detected")
            .commentText(commentText)
            .violationCount(violationCount)
            .autoAdded(true)
            .thresholdViolations(3)
            .status(BlacklistStatus.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();
        
        return blacklistRepository.save(blacklistUser);
    }
    
    /**
     * 블랙리스트 조회
     */
    public List<BlacklistUser> getUserBlacklist(Long userId) {
        return blacklistRepository.findByUserIdAndStatus(userId, BlacklistStatus.ACTIVE);
    }
    
    /**
     * 블랙리스트에서 제거
     */
    public void removeFromBlacklist(Long blacklistId) {
        BlacklistUser blacklistUser = blacklistRepository.findById(blacklistId)
            .orElseThrow(() -> new IllegalArgumentException("Blacklist entry not found"));
        
        blacklistUser.setStatus(BlacklistStatus.REMOVED);
        blacklistUser.setUpdatedAt(LocalDateTime.now());
        
        blacklistRepository.save(blacklistUser);
    }
    
    /**
     * 위반 횟수 증가
     */
    public void incrementViolationCount(Long userId, String authorIdentifier) {
        blacklistRepository.findByUserIdAndBlockedAuthorIdentifier(userId, authorIdentifier)
            .ifPresent(blacklistUser -> {
                blacklistUser.setViolationCount(blacklistUser.getViolationCount() + 1);
                blacklistUser.setUpdatedAt(LocalDateTime.now());
                blacklistRepository.save(blacklistUser);
            });
    }
    
    /**
     * 블랙리스트 확인
     */
    public boolean isBlacklisted(Long userId, String authorIdentifier) {
        return blacklistRepository.existsByUserIdAndBlockedAuthorIdentifier(userId, authorIdentifier);
    }
}