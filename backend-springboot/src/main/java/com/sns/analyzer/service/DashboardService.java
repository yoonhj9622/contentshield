// [File: DashboardService.java / Date: 2026-01-22 / 설명: 대시보드 통계 데이터 집계 및 가공 로직 구현]
package com.sns.analyzer.service;

import com.sns.analyzer.entity.AnalysisResult;
import com.sns.analyzer.repository.AnalysisResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final AnalysisResultRepository analysisResultRepository;
    private final com.sns.analyzer.repository.CommentRepository commentRepository;

    public Map<String, Object> getDashboardStats(Long userId) {
        System.out.println("[DEBUG] DashboardService.getDashboardStats called for userId: " + userId);

        // 1. Comment 엔티티를 사용하여 정확한 통계 계산 (isMalicious 플래그 사용)
        List<com.sns.analyzer.entity.Comment> userComments = commentRepository.findByUserId(userId);
        System.out.println("[DEBUG] Found " + userComments.size() + " comments for user " + userId);

        long total = userComments.size();
        long malicious = userComments.stream().filter(com.sns.analyzer.entity.Comment::getIsMalicious).count();
        long clean = total - malicious;
        double detectionRate = total > 0 ? (malicious * 100.0 / total) : 0.0;

        // 2. 주간 활동 및 최근 알림은 AnalysisResult 사용 (기존 유지)
        List<AnalysisResult> allResults = analysisResultRepository.findByUserId(userId);

        // Weekly Activity (Last 7 days)
        List<Map<String, Object>> weeklyActivity = getWeeklyActivity(allResults);

        // Recent Notifications (Last 5)
        List<Map<String, Object>> notifications = allResults.stream()
                .sorted(Comparator.comparing(AnalysisResult::getAnalyzedAt).reversed())
                .limit(5)
                .map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", r.getAnalysisId());
                    map.put("isMalicious", r.getIsMalicious());
                    map.put("category", r.getCategory());
                    map.put("analyzedAt", r.getAnalyzedAt());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("malicious", malicious);
        stats.put("clean", clean);
        stats.put("detectionRate", String.format("%.1f%%", detectionRate));
        stats.put("weeklyActivity", weeklyActivity);
        stats.put("notifications", notifications);

        return stats;
    }

    private List<Map<String, Object>> getWeeklyActivity(List<AnalysisResult> results) {
        LocalDate today = LocalDate.now();
        Map<String, Long> countsByDate = results.stream()
                .filter(r -> r.getAnalyzedAt().isAfter(today.minusDays(7).atStartOfDay()))
                .collect(Collectors.groupingBy(
                        r -> r.getAnalyzedAt().toLocalDate().toString(),
                        Collectors.counting()));

        List<Map<String, Object>> weekly = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("E");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("name", date.format(formatter)); // Mon, Tue...
            dayMap.put("count", countsByDate.getOrDefault(date.toString(), 0L));
            weekly.add(dayMap);
        }
        return weekly;
    }
}
