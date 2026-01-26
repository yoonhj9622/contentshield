// ==================== SuggestionService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.Suggestion;
import com.sns.analyzer.repository.SuggestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SuggestionService {
    
    private final SuggestionRepository suggestionRepository;
    
    public Suggestion createSuggestion(Long userId, String title, String content) {
        Suggestion suggestion = Suggestion.builder()
            .userId(userId)
            .title(title)
            .content(content)
            .build();
        
        return suggestionRepository.save(suggestion);
    }
    
    @Transactional(readOnly = true)
    public List<Suggestion> getUserSuggestions(Long userId) {
        return suggestionRepository.findByUserId(userId);
    }
    
    @Transactional(readOnly = true)
    public List<Suggestion> getAllSuggestions() {
        return suggestionRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Suggestion> getSuggestionsByStatus(Suggestion.SuggestionStatus status) {
        return suggestionRepository.findByStatus(status);
    }
    
    public Suggestion updateStatus(Long suggestionId, String status) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
            .orElseThrow(() -> new IllegalArgumentException("Suggestion not found"));
        
        suggestion.setStatus(Suggestion.SuggestionStatus.valueOf(status));
        return suggestionRepository.save(suggestion);
    }
    
    public Suggestion respondToSuggestion(Long suggestionId, Long adminId, String response) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
            .orElseThrow(() -> new IllegalArgumentException("Suggestion not found"));
        
        suggestion.setAdminResponse(response);
        suggestion.setRespondedBy(adminId);
        suggestion.setRespondedAt(LocalDateTime.now());
        suggestion.setStatus(Suggestion.SuggestionStatus.COMPLETED);
        
        return suggestionRepository.save(suggestion);
    }
}