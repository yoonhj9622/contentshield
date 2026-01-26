package com.sns.analyzer.controller;

import com.sns.analyzer.entity.User;
import com.sns.analyzer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {
    
    private final UserRepository userRepository;
    
    /**
     * 서버 및 DB 연결 상태 확인
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // DB 연결 테스트
            long userCount = userRepository.count();
            
            response.put("status", "OK");
            response.put("message", "✅ 서버 정상 작동 중");
            response.put("database", "✅ DB 연결 성공");
            response.put("userCount", userCount);
            response.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "❌ DB 연결 실패");
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * 전체 사용자 목록 조회 (개발용)
     */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }
    
    /**
     * 사용자 수 조회
     */
    @GetMapping("/users/count")
    public ResponseEntity<Map<String, Object>> getUserCount() {
        Map<String, Object> response = new HashMap<>();
        response.put("totalUsers", userRepository.count());
        response.put("message", "총 사용자 수");
        return ResponseEntity.ok(response);
    }
    
    /**
     * 간단한 핑 테스트
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("🏓 pong!");
    }

    /**
 * 역할별 사용자 수 조회
 */
    @GetMapping("/users/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            long totalUsers = userRepository.count();
            long adminCount = userRepository.findByRole(User.UserRole.ADMIN).size();
            long userCount = userRepository.findByRole(User.UserRole.USER).size();
            long suspendedCount = userRepository.findByIsSuspended(true).size();
            long flaggedCount = userRepository.findByIsFlagged(true).size();
            
            response.put("totalUsers", totalUsers);
            response.put("adminCount", adminCount);
            response.put("userCount", userCount);
            response.put("suspendedCount", suspendedCount);
            response.put("flaggedCount", flaggedCount);
            response.put("message", "✅ 사용자 통계 조회 성공");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", e.getMessage());
            response.put("message", "❌ 통계 조회 실패");
            return ResponseEntity.status(500).body(response);
        }
    }
}