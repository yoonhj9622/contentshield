package com.sns.analyzer.service;

import com.sns.analyzer.entity.User;
// ⭐ UserRole은 User 클래스 안에 있는 내부 enum이므로 별도 import 불필요
// import com.sns.analyzer.entity.UserRole; ❌ 삭제!
import com.sns.analyzer.repository.UserRepository;
import com.sns.analyzer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    
    public User signup(String email, String password, String username) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        
        User user = User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(password))
            .username(username)
            .role(User.UserRole.USER)  // ✅ User.UserRole로 접근
            .build();
        
        return userRepository.save(user);
    }
    
    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        
        return jwtTokenProvider.generateToken(user.getEmail());
    }
    
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}