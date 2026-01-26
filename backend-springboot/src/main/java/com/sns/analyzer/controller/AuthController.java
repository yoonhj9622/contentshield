// ==================== AuthController.java ====================
package com.sns.analyzer.controller;
// 파일 상단에 import 추가
import org.springframework.security.core.AuthenticationException;
import com.sns.analyzer.entity.User;
import com.sns.analyzer.service.UserService;
import com.sns.analyzer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
//@CrossOrigin(origins = "*")
public class AuthController {
    
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    
    /**
     * 회원가입
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            User user = userService.createUser(
                request.getEmail(),
                request.getPassword(),
                request.getUsername()
            );
            
            return ResponseEntity.ok(Map.of(
                "message", "User created successfully",
                "userId", user.getUserId()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
            
            String token = tokenProvider.generateToken(authentication);
            
            User user = userService.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            userService.updateLastLogin(user.getUserId());
            
            return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", user.getUserId(),
                "email", user.getEmail(),
                "username", user.getUsername() != null ? user.getUsername() : "",
                "role", user.getRole().toString()
            ));
            
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }
    
    /**
     * 현재 사용자 정보
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return ResponseEntity.ok(Map.of(
            "userId", user.getUserId(),
            "email", user.getEmail(),
            "username", user.getUsername() != null ? user.getUsername() : "",
            "role", user.getRole().toString(),
            "status", user.getStatus().toString()
        ));
    }
    
    // DTO 클래스
    static class SignupRequest {
        private String email;
        private String password;
        private String username;
        
        public String getEmail() { return email; }
        public String getPassword() { return password; }
        public String getUsername() { return username; }
        
        public void setEmail(String email) { this.email = email; }
        public void setPassword(String password) { this.password = password; }
        public void setUsername(String username) { this.username = username; }
    }
    
    static class LoginRequest {
        private String email;
        private String password;
        
        public String getEmail() { return email; }
        public String getPassword() { return password; }
        
        public void setEmail(String email) { this.email = email; }
        public void setPassword(String password) { this.password = password; }
    }
}