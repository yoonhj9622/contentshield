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
@RequestMapping("/api/channels")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChannelController {
    
    private final ChannelService channelService;
    private final UserService userService;
    
    /**
     * 사용자 채널 목록
     */
    @GetMapping
    public ResponseEntity<List<UserChannel>> getUserChannels(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(channelService.getUserChannels(userId));
    }
    
    /**
     * 채널 추가
     */
    @PostMapping
    public ResponseEntity<?> addChannel(
        Authentication authentication,
        @RequestBody ChannelRequest request
    ) {
        try {
            Long userId = getUserId(authentication);
            
            UserChannel channel = channelService.addChannel(
                userId,
                request.getPlatform().name(),
                request.getChannelName(),
                request.getChannelUrl()
            );
            
            return ResponseEntity.ok(channel);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 채널 인증
     */
    @PostMapping("/{channelId}/verify")
    public ResponseEntity<?> verifyChannel(@PathVariable Long channelId) {
        UserChannel channel = channelService.verifyChannel(channelId);
        return ResponseEntity.ok(channel);
    }
    
    /**
     * 채널 삭제
     */
    @DeleteMapping("/{channelId}")
    public ResponseEntity<?> deleteChannel(@PathVariable Long channelId) {
        channelService.deleteChannel(channelId);
        return ResponseEntity.ok(Map.of("message", "Channel deleted"));
    }
    
    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }
    
    static class ChannelRequest {
        private UserChannel.Platform platform;
        private String channelName;
        private String channelUrl;
        
        public UserChannel.Platform getPlatform() { return platform; }
        public String getChannelName() { return channelName; }
        public String getChannelUrl() { return channelUrl; }
        
        public void setPlatform(UserChannel.Platform platform) { 
            this.platform = platform; 
        }
        public void setChannelName(String channelName) { 
            this.channelName = channelName; 
        }
        public void setChannelUrl(String channelUrl) { 
            this.channelUrl = channelUrl; 
        }
    }
}