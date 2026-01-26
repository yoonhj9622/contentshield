package com.sns.analyzer.controller;

import com.sns.analyzer.dto.BlacklistDTO;
import com.sns.analyzer.entity.BlacklistUser;
import com.sns.analyzer.entity.BlacklistUser.Platform;
import com.sns.analyzer.entity.User;
import com.sns.analyzer.service.BlacklistService;
import com.sns.analyzer.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors; // 👈 꼭 확인해야 할 임포트

@RestController
@RequestMapping("/api/blacklist")
@RequiredArgsConstructor
public class BlacklistController {

    private final BlacklistService blacklistService;
    private final UserService userService;

    /**
     * 블랙리스트 조회 (DTO로 변환하여 commentText를 명시적으로 포함)
     */
    @GetMapping
    public ResponseEntity<List<BlacklistDTO.BlacklistResponse>> getBlacklist(Authentication authentication) {
        Long userId = getUserId(authentication);
        List<BlacklistUser> users = blacklistService.getUserBlacklist(userId);

        // 엔티티 리스트를 DTO 리스트로 변환
        List<BlacklistDTO.BlacklistResponse> response = users.stream()
                .map(user -> BlacklistDTO.BlacklistResponse.builder()
                        .blacklistId(user.getBlacklistId())
                        .userId(user.getUserId())
                        .channelId(user.getChannelId())
                        .blockedAuthorName(user.getBlockedAuthorName())
                        .blockedAuthorIdentifier(user.getBlockedAuthorIdentifier())
                        .platform(user.getPlatform().name())
                        .reason(user.getReason())
                        .commentText(user.getCommentText()) // ✨ 이제 이 데이터가 JSON으로 나갑니다.
                        .violationCount(user.getViolationCount())
                        .autoAdded(user.getAutoAdded())
                        .status(user.getStatus().name())
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * 블랙리스트 추가
     */
    @PostMapping
    public ResponseEntity<?> addToBlacklist(
            Authentication authentication,
            @RequestBody BlacklistRequest request) {
        try {
            Long userId = getUserId(authentication);

            Platform platform = Platform.YOUTUBE;
            if (request.getPlatform() != null) {
                try {
                    platform = Platform.valueOf(request.getPlatform().toUpperCase());
                } catch (Exception e) {
                    platform = Platform.YOUTUBE;
                }
            }

            // 1. 엔티티 저장
            BlacklistUser savedUser = blacklistService.addToBlacklist(
                    userId,
                    request.getChannelId() != null ? request.getChannelId() : 0L,
                    request.getAuthorName(),
                    request.getAuthorIdentifier(),
                    platform,
                    request.getReason(),
                    request.getCommentText());

            // 2. 저장된 엔티티를 DTO로 변환하여 응답 (에러 방지용)
            BlacklistDTO.BlacklistResponse response = BlacklistDTO.BlacklistResponse.builder()
                    .blacklistId(savedUser.getBlacklistId())
                    .userId(savedUser.getUserId())
                    .blockedAuthorName(savedUser.getBlockedAuthorName())
                    .blockedAuthorIdentifier(savedUser.getBlockedAuthorIdentifier())
                    .platform(savedUser.getPlatform().name())
                    .reason(savedUser.getReason())
                    .commentText(savedUser.getCommentText())
                    .violationCount(savedUser.getViolationCount())
                    .status(savedUser.getStatus().name())
                    .createdAt(savedUser.getCreatedAt())
                    .build();

            return ResponseEntity.ok(response); // 👈 엔티티 대신 DTO 응답!

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 블랙리스트 제거
     */
    @DeleteMapping("/{blacklistId}")
    public ResponseEntity<?> removeFromBlacklist(@PathVariable Long blacklistId) {
        try {
            blacklistService.removeFromBlacklist(blacklistId);
            return ResponseEntity.ok(Map.of("message", "Removed from blacklist"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }

    // Request DTO (내부 정적 클래스)
    static class BlacklistRequest {
        private Long channelId;
        private String authorName;
        private String authorIdentifier;
        private String platform;
        private String reason;
        private String commentText;

        public Long getChannelId() {
            return channelId;
        }

        public String getAuthorName() {
            return authorName;
        }

        public String getAuthorIdentifier() {
            return authorIdentifier;
        }

        public String getPlatform() {
            return platform;
        }

        public String getReason() {
            return reason;
        }

        public String getCommentText() {
            return commentText;
        }

        public void setChannelId(Long channelId) {
            this.channelId = channelId;
        }

        public void setAuthorName(String authorName) {
            this.authorName = authorName;
        }

        public void setAuthorIdentifier(String authorIdentifier) {
            this.authorIdentifier = authorIdentifier;
        }

        public void setPlatform(String platform) {
            this.platform = platform;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public void setCommentText(String commentText) {
            this.commentText = commentText;
        }
    }
}