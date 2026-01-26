package com.sns.analyzer.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {
    
    private final SecretKey key;
    private final long jwtExpirationInMs;
    
    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration:86400000}") long jwtExpirationInMs) {
        // SecretKey 생성 (HS256은 최소 256bit = 32bytes 필요)
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.jwtExpirationInMs = jwtExpirationInMs;
    }
    
    // Authentication 받는 버전
    public String generateToken(Authentication authentication) {
        String email = authentication.getName();
        return generateToken(email);
    }
    
    // String username 받는 버전
    public String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(username)  // setSubject() 대신 subject()
                .issuedAt(now)      // setIssuedAt() 대신 issuedAt()
                .expiration(expiryDate)  // setExpiration() 대신 expiration()
                .signWith(key)      // ✅ 알고리즘 자동 선택 (HS256)
                .compact();
    }
    
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)    // setSigningKey() 대신 verifyWith()
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        return claims.getSubject();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}