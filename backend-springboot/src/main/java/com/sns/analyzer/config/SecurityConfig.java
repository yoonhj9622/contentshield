package com.sns.analyzer.config;

import com.sns.analyzer.security.JwtAuthenticationFilter;
import com.sns.analyzer.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final CustomUserDetailsService userDetailsService;
        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration authConfig) throws Exception {
                return authConfig.getAuthenticationManager();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
                authProvider.setUserDetailsService(userDetailsService);
                authProvider.setPasswordEncoder(passwordEncoder());
                return authProvider;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

                // ============================================
                // 개발 모드: 모든 API 허용 (현재 활성화)
                // ============================================
                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .anyRequest().permitAll() // 🔓 모든 요청 허용 (개발용)
                                )
                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();

                // ============================================
                // 운영 모드: JWT 인증 활성화 (나중에 사용)
                // ============================================
                // 배포 시 위의 개발 모드를 주석 처리하고 아래 코드의 주석을 해제하세요
                /*
                 * http
                 * .csrf(csrf -> csrf.disable())
                 * .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                 * .sessionManagement(session ->
                 * session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                 * )
                 * .authorizeHttpRequests(auth -> auth
                 * // 🔓 공개 엔드포인트 - 인증 없이 접근 가능
                 * .requestMatchers("/api/auth/**").permitAll() // 로그인, 회원가입
                 * .requestMatchers("/api/notices/**").permitAll() // 공지사항 조회
                 * .requestMatchers("/api/public/**").permitAll() // 기타 공개 API
                 * .requestMatchers("/actuator/health").permitAll() // 헬스체크
                 * 
                 * // 🔐 관리자 전용 엔드포인트
                 * .requestMatchers("/api/admin/**").hasRole("ADMIN")
                 * 
                 * // 🔐 나머지는 인증 필요 (JWT 토큰 필수)
                 * .anyRequest().authenticated()
                 * )
                 * .authenticationProvider(authenticationProvider())
                 * .addFilterBefore(
                 * jwtAuthenticationFilter,
                 * UsernamePasswordAuthenticationFilter.class
                 * );
                 * 
                 * return http.build();
                 */
        }

        // [File: SecurityConfig.java / Date: 2026-01-22 / 설명: 프론트엔드 포트(3000, 3001) 및 인증
        // 헤더 허용을 위한 CORS 설정 수정]
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                // 허용할 도메인 (프론트엔드 주소)
                configuration.setAllowedOrigins(Arrays.asList(
                                "http://localhost:3000", // React 기본 포트
                                "http://localhost:3001", // React 대체 포트 (3001)
                                "http://localhost:5173", // Vite 기본 포트
                                "https://your-domain.com" // 실제 배포 도메인으로 변경
                ));

                // 허용할 HTTP 메서드
                configuration.setAllowedMethods(Arrays.asList(
                                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

                // 허용할 헤더
                configuration.setAllowedHeaders(Arrays.asList(
                                "Authorization",
                                "Content-Type",
                                "X-Requested-With"));

                // 응답에 노출할 헤더
                configuration.setExposedHeaders(Arrays.asList(
                                "Authorization"));

                // 쿠키/인증 정보 허용
                configuration.setAllowCredentials(true);

                // preflight 요청 캐시 시간 (초)
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);

                return source;
        }
}