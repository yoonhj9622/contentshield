// [File: DashboardController.java / Date: 2026-01-22 / 설명: 대시보드 통계 조회 엔드포인트 구현]
package com.sns.analyzer.controller;

import com.sns.analyzer.entity.User;
import com.sns.analyzer.service.DashboardService;
import com.sns.analyzer.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173" })
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String email = authentication.getName();
        System.out.println("[DEBUG] Dashboard request for email: " + email);
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        System.out.println("[DEBUG] Found user: " + user.getUserId() + " (" + user.getUsername() + ")");

        return ResponseEntity.ok(dashboardService.getDashboardStats(user.getUserId()));
    }
}
