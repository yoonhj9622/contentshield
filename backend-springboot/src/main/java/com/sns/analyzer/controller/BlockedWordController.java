// ==================== BlockedWordController.java ====================
package com.sns.analyzer.controller;

import com.sns.analyzer.entity.BlockedWord;
import com.sns.analyzer.entity.User;
import com.sns.analyzer.service.BlockedWordService;
import com.sns.analyzer.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blocked-words")
@RequiredArgsConstructor
public class BlockedWordController {
    
    private final BlockedWordService blockedWordService;
    private final UserService userService;
    
    /**
     * 차단 단어 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BlockedWord>> getBlockedWords(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        List<BlockedWord> words = blockedWordService.getUserBlockedWords(userId);
        return ResponseEntity.ok(words);
    }
    
    /**
     * 차단 단어 추가
     */
    @PostMapping
    public ResponseEntity<?> addBlockedWord(
            Authentication authentication,
            @RequestBody Map<String, String> request
    ) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            
            String word = request.get("word");
            if (word == null || word.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "단어를 입력해주세요."));
            }
            
            BlockedWord.WordCategory category = null;
            if (request.get("category") != null) {
                category = BlockedWord.WordCategory.valueOf(request.get("category"));
            }
            
            BlockedWord.Severity severity = null;
            if (request.get("severity") != null) {
                severity = BlockedWord.Severity.valueOf(request.get("severity"));
            }
            
            BlockedWord saved = blockedWordService.addBlockedWord(userId, word, category, severity);
            return ResponseEntity.ok(saved);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 차단 단어 수정
     */
    @PutMapping("/{wordId}")
    public ResponseEntity<?> updateBlockedWord(
            Authentication authentication,
            @PathVariable Long wordId,
            @RequestBody Map<String, String> request
    ) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            
            String word = request.get("word");
            
            BlockedWord.WordCategory category = null;
            if (request.get("category") != null) {
                category = BlockedWord.WordCategory.valueOf(request.get("category"));
            }
            
            BlockedWord.Severity severity = null;
            if (request.get("severity") != null) {
                severity = BlockedWord.Severity.valueOf(request.get("severity"));
            }
            
            BlockedWord updated = blockedWordService.updateBlockedWord(wordId, userId, word, category, severity);
            return ResponseEntity.ok(updated);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 차단 단어 삭제
     */
    @DeleteMapping("/{wordId}")
    public ResponseEntity<?> deleteBlockedWord(
            Authentication authentication,
            @PathVariable Long wordId
    ) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            blockedWordService.deleteBlockedWord(wordId, userId);
            return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 차단 단어 활성화/비활성화 토글
     */
    @PatchMapping("/{wordId}/toggle")
    public ResponseEntity<?> toggleBlockedWord(
            Authentication authentication,
            @PathVariable Long wordId
    ) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            BlockedWord updated = blockedWordService.toggleBlockedWord(wordId, userId);
            return ResponseEntity.ok(updated);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    private Long getUserIdFromAuth(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }
}