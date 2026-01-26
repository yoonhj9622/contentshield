package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blacklist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BlacklistController {
    
    private final BlacklistService blacklistService;
    private final UserService userService;
    
    /**
     * 블랙리스트 조회
     */
    @GetMapping
    public ResponseEntity<List<BlacklistUser>> getBlacklist(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(blacklistService.getUserBlacklist(userId));
    }
    
    /**
     * 블랙리스트 추가
     */
    @PostMapping
    public ResponseEntity<?> addToBlacklist(
        Authentication authentication,
        @RequestBody BlacklistRequest request
    ) {
        Long userId = getUserId(authentication);
        
        BlacklistUser blacklistUser = blacklistService.addToBlacklist(
            userId,
            request.getChannelId(),
            request.getAuthorName(),
            request.getAuthorIdentifier(),
            request.getPlatform(),
            request.getReason()
        );
        
        return ResponseEntity.ok(blacklistUser);
    }
    
    /**
     * 블랙리스트 제거
     */
    @DeleteMapping("/{blacklistId}")
    public ResponseEntity<?> removeFromBlacklist(@PathVariable Long blacklistId) {
        blacklistService.removeFromBlacklist(blacklistId);
        return ResponseEntity.ok(Map.of("message", "Removed from blacklist"));
    }
    
    /**
     * 블랙리스트 상태 변경
     */
    @PutMapping("/{blacklistId}/status")
    public ResponseEntity<?> updateStatus(
        @PathVariable Long blacklistId,
        @RequestBody Map<String, String> body
    ) {
        // 상태 변경 로직 (필요시 구현)
        return ResponseEntity.ok(Map.of("message", "Status updated"));
    }
    
    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }
    
    static class BlacklistRequest {
        private Long channelId;
        private String authorName;
        private String authorIdentifier;
        private BlacklistUser.Platform platform;
        private String reason;
        
        public Long getChannelId() { return channelId; }
        public String getAuthorName() { return authorName; }
        public String getAuthorIdentifier() { return authorIdentifier; }
        public BlacklistUser.Platform getPlatform() { return platform; }
        public String getReason() { return reason; }
        
        public void setChannelId(Long channelId) { 
            this.channelId = channelId; 
        }
        public void setAuthorName(String authorName) { 
            this.authorName = authorName; 
        }
        public void setAuthorIdentifier(String authorIdentifier) { 
            this.authorIdentifier = authorIdentifier; 
        }
        public void setPlatform(BlacklistUser.Platform platform) { 
            this.platform = platform; 
        }
        public void setReason(String reason) { 
            this.reason = reason; 
        }
    }
}