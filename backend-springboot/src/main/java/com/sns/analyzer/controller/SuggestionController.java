package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suggestions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuggestionController {
    
    private final SuggestionService suggestionService;
    private final UserService userService;
    
    /**
     * 내 건의사항 조회
     */
    @GetMapping
    public ResponseEntity<List<Suggestion>> getMySuggestions(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(suggestionService.getUserSuggestions(userId));
    }
    
    /**
     * 모든 건의사항 조회 (관리자만)
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Suggestion>> getAllSuggestions() {
        return ResponseEntity.ok(suggestionService.getAllSuggestions());
    }
    
    /**
     * 건의사항 상세
     */
    @GetMapping("/{suggestionId}")
    public ResponseEntity<Suggestion> getSuggestion(@PathVariable Long suggestionId) {
        // TODO: 권한 체크 (본인 또는 관리자만)
        return ResponseEntity.ok(
            suggestionService.getAllSuggestions().stream()
                .filter(s -> s.getSuggestionId().equals(suggestionId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Suggestion not found"))
        );
    }
    
    /**
     * 건의사항 생성
     */
    @PostMapping
    public ResponseEntity<?> createSuggestion(
        Authentication authentication,
        @RequestBody SuggestionRequest request
    ) {
        Long userId = getUserId(authentication);
        
        Suggestion suggestion = suggestionService.createSuggestion(
            userId,
            request.getTitle(),
            request.getContent()
        );
        
        return ResponseEntity.ok(suggestion);
    }
    
    /**
     * 건의사항 상태 변경 (관리자만)
     */
    @PutMapping("/{suggestionId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(
        @PathVariable Long suggestionId,
        @RequestBody Map<String, String> body
    ) {
        Suggestion.SuggestionStatus status = Suggestion.SuggestionStatus.valueOf(body.get("status"));
        
        Suggestion updated = suggestionService.updateStatus(suggestionId, status.name());
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 건의사항 답변 (관리자만)
     */
    @PostMapping("/{suggestionId}/response")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> respondToSuggestion(
        @PathVariable Long suggestionId,
        @RequestBody Map<String, String> body,
        Authentication authentication
    ) {
        Long adminId = getAdminId(authentication);
        
        Suggestion responded = suggestionService.respondToSuggestion(
            suggestionId,
            adminId,
            body.get("response")
        );
        
        return ResponseEntity.ok(responded);
    }
    
    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }
    
    private Long getAdminId(Authentication authentication) {
        String email = authentication.getName();
        User admin = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        return admin.getUserId();
    }
    
    static class SuggestionRequest {
        private String title;
        private String content;
        
        public String getTitle() { return title; }
        public String getContent() { return content; }
        
        public void setTitle(String title) { this.title = title; }
        public void setContent(String content) { this.content = content; }
    }
}