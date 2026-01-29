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
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {

        // #장소영~ (username/email 둘 다 로그인 허용)
        User user = userRepository.findByEmail(loginId)
                .orElseGet(() -> userRepository.findByUsername(loginId)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + loginId)));
        // #여기까지

        // #장소영~ 시나리오 요구사항 반영
        // - SUSPENDED는 "로그인은 되지만 서비스 이용 불가"여야 하므로 login 자체를 잠그지 않음
        // - INACTIVE/DELETED만 로그인 자체를 막음
        boolean disabled = (user.getStatus() == User.UserStatus.INACTIVE || user.getStatus() == User.UserStatus.DELETED);
        // #여기까지

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(getAuthorities(user))
                .accountExpired(false)
                // #장소영~ 정지여도 로그인은 허용(서비스 API에서 막기)
                .accountLocked(false)
                // #여기까지
                .credentialsExpired(false)
                // #장소영~ INACTIVE/DELETED만 로그인 차단
                .disabled(disabled)
                // #여기까지
                .build();
    }

    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        return authorities;
    }
}
