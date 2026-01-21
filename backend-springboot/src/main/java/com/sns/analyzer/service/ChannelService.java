// ==================== ChannelService.java ====================
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
public class ChannelService {
    
    private final UserChannelRepository userChannelRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    
    public UserChannel addChannel(Long userId, String platform, String channelName, String channelUrl) {
        // 구독 제한 확인
        UserSubscription subscription = userSubscriptionRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        
        long currentChannelCount = userChannelRepository.countByUserId(userId);
        if (currentChannelCount >= subscription.getChannelLimit()) {
            throw new IllegalArgumentException("Channel limit reached for current subscription");
        }
        
        UserChannel channel = UserChannel.builder()
            .userId(userId)
            .platform(UserChannel.Platform.valueOf(platform))
            .channelName(channelName)
            .channelUrl(channelUrl)
            .build();
        
        return userChannelRepository.save(channel);
    }
    
    @Transactional(readOnly = true)
    public List<UserChannel> getUserChannels(Long userId) {
        return userChannelRepository.findByUserId(userId);
    }
    
    @Transactional(readOnly = true)
    public List<UserChannel> getActiveChannels(Long userId) {
        return userChannelRepository.findByUserId(userId).stream()
            .filter(UserChannel::getIsActive)
            .toList();
    }
    
    public UserChannel verifyChannel(Long channelId) {
        UserChannel channel = userChannelRepository.findById(channelId)
            .orElseThrow(() -> new IllegalArgumentException("Channel not found"));
        
        channel.setVerificationStatus(UserChannel.VerificationStatus.VERIFIED);
        channel.setVerifiedAt(LocalDateTime.now());
        
        return userChannelRepository.save(channel);
    }
    
    public void deactivateChannel(Long channelId) {
        UserChannel channel = userChannelRepository.findById(channelId)
            .orElseThrow(() -> new IllegalArgumentException("Channel not found"));
        
        channel.setIsActive(false);
        userChannelRepository.save(channel);
    }
    
    public void deleteChannel(Long channelId) {
        userChannelRepository.deleteById(channelId);
    }
    
    public void updateChannelStats(Long channelId, Integer totalPosts, Integer totalComments) {
        UserChannel channel = userChannelRepository.findById(channelId)
            .orElseThrow(() -> new IllegalArgumentException("Channel not found"));
        
        if (totalPosts != null) channel.setTotalPosts(totalPosts);
        if (totalComments != null) channel.setTotalComments(totalComments);
        channel.setLastSyncedAt(LocalDateTime.now());
        
        userChannelRepository.save(channel);
    }
}