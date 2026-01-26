// ==================== CustomUserDetailsService.java ====================
package com.sns.analyzer.security;

import com.sns.analyzer.entity.User;
import com.sns.analyzer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserRepository userRepository;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPasswordHash())
            .authorities(getAuthorities(user))
            .accountExpired(false)
            .accountLocked(user.getIsSuspended())
            .credentialsExpired(false)
            .disabled(user.getStatus() != User.UserStatus.ACTIVE)
            .build();
    }
    
    /**
     * 사용자 권한 설정
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // 역할 추가
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        
        return authorities;
    }
}
