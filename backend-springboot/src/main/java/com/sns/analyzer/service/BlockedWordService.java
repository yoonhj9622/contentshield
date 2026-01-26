// ==================== BlockedWordService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.BlockedWord;
import com.sns.analyzer.repository.BlockedWordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BlockedWordService {
    
    private final BlockedWordRepository blockedWordRepository;
    
    /**
     * 사용자의 차단 단어 목록 조회
     */
    public List<BlockedWord> getUserBlockedWords(Long userId) {
        return blockedWordRepository.findByUserId(userId);
    }
    
    /**
     * 사용자의 활성화된 차단 단어 목록 조회
     */
    public List<BlockedWord> getActiveBlockedWords(Long userId) {
        return blockedWordRepository.findByUserIdAndIsActive(userId, true);
    }
    
    /**
     * 차단 단어 추가
     */
    public BlockedWord addBlockedWord(Long userId, String word, 
            BlockedWord.WordCategory category, BlockedWord.Severity severity) {
        
        // 중복 체크
        if (blockedWordRepository.existsByUserIdAndWord(userId, word)) {
            throw new IllegalArgumentException("이미 등록된 단어입니다: " + word);
        }
        
        BlockedWord blockedWord = BlockedWord.builder()
                .userId(userId)
                .word(word.trim())
                .category(category != null ? category : BlockedWord.WordCategory.PROFANITY)
                .severity(severity != null ? severity : BlockedWord.Severity.MEDIUM)
                .language("ko")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
        
        return blockedWordRepository.save(blockedWord);
    }
    
    /**
     * 차단 단어 수정
     */
    public BlockedWord updateBlockedWord(Long wordId, Long userId, 
            String word, BlockedWord.WordCategory category, BlockedWord.Severity severity) {
        
        BlockedWord blockedWord = blockedWordRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("차단 단어를 찾을 수 없습니다."));
        
        // 소유권 확인
        if (!blockedWord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        if (word != null) blockedWord.setWord(word.trim());
        if (category != null) blockedWord.setCategory(category);
        if (severity != null) blockedWord.setSeverity(severity);
        blockedWord.setUpdatedAt(LocalDateTime.now());
        
        return blockedWordRepository.save(blockedWord);
    }
    
    /**
     * 차단 단어 삭제
     */
    public void deleteBlockedWord(Long wordId, Long userId) {
        BlockedWord blockedWord = blockedWordRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("차단 단어를 찾을 수 없습니다."));
        
        // 소유권 확인
        if (!blockedWord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        blockedWordRepository.delete(blockedWord);
    }
    
    /**
     * 차단 단어 활성화/비활성화 토글
     */
    public BlockedWord toggleBlockedWord(Long wordId, Long userId) {
        BlockedWord blockedWord = blockedWordRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("차단 단어를 찾을 수 없습니다."));
        
        // 소유권 확인
        if (!blockedWord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        blockedWord.setIsActive(!blockedWord.getIsActive());
        blockedWord.setUpdatedAt(LocalDateTime.now());
        
        return blockedWordRepository.save(blockedWord);
    }
    
    /**
     * 분석용: 사용자의 차단 단어 문자열 목록 반환
     */
    public List<String> getActiveBlockedWordStrings(Long userId) {
        return blockedWordRepository.findByUserIdAndIsActive(userId, true)
                .stream()
                .map(BlockedWord::getWord)
                .toList();
    }
}