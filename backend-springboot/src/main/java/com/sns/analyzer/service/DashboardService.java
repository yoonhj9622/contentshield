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
import java.time.temporal.TemporalAdjusters;
import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final AnalysisResultRepository analysisResultRepository;
    private final com.sns.analyzer.repository.CommentRepository commentRepository;
    private final BlacklistService blacklistService;

    public Map<String, Object> getDashboardStats(Long userId) {
        System.out.println("[DEBUG] DashboardService.getDashboardStats called for userId: " + userId);

        // 1. AnalysisResult 엔티티를 사용하여 전체 히스토리 통계 계산
        // (Comment 테이블은 현재 세션만 유지하므로, 전체 통계는 AnalysisResult를 사용해야 함)
        List<AnalysisResult> allResults = analysisResultRepository.findByUserId(userId);
        System.out.println("[DEBUG] Found " + allResults.size() + " analysis results for user " + userId);

        long total = allResults.size();
        long malicious = allResults.stream()
                .filter(r -> Boolean.TRUE.equals(r.isMalicious())).count();
        long clean = total - malicious;
        double detectionRate = total > 0 ? (malicious * 100.0 / total) : 0.0;

        // 2. 주간 활동 및 최근 알림도 AnalysisResult 사용 (기존 유지)

        // 3. 유형별 분석 현황 (Type Breakdown)
        // [수정] DB에 저장된 카테고리가 'safe'라도 점수가 0보다 크면 'moderately_toxic'으로 집계 (카드 숫자와 차트 일치)
        Map<String, Long> typeBreakdown = allResults.stream()
                .collect(Collectors.groupingBy(r -> {
                    boolean isEffectiveMalicious = r.getToxicityScore() != null
                            && r.getToxicityScore().compareTo(BigDecimal.ZERO) > 0;

                    if (isEffectiveMalicious && "safe".equalsIgnoreCase(r.getCategory())) {
                        return "moderately_toxic";
                    }
                    return r.getCategory();
                }, Collectors.counting()));

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
        stats.put("typeBreakdown", typeBreakdown);
        stats.put("weeklyMaliciousActivity", getWeeklyMaliciousActivity(allResults));

        // Blacklist Count
        int blacklistCount = blacklistService.getUserBlacklist(userId).size();
        stats.put("blacklistCount", blacklistCount);

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

    private List<Map<String, Object>> getWeeklyMaliciousActivity(List<AnalysisResult> results) {
        LocalDate today = LocalDate.now();
        // Calculate Monday of the current week (or today if today is Monday)
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = startOfWeek.plusDays(6);

        Map<String, Long> countsByDate = results.stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsMalicious()))
                .filter(r -> {
                    LocalDate d = r.getAnalyzedAt().toLocalDate();
                    return !d.isBefore(startOfWeek) && !d.isAfter(endOfWeek);
                })
                .collect(Collectors.groupingBy(
                        r -> r.getAnalyzedAt().toLocalDate().toString(),
                        Collectors.counting()));

        List<Map<String, Object>> weekly = new ArrayList<>();
        // Use Korean locale for day names (월, 화, 수...)
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("E", Locale.KOREA);

        for (int i = 0; i < 7; i++) {
            LocalDate date = startOfWeek.plusDays(i);
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("name", date.format(formatter));
            dayMap.put("count", countsByDate.getOrDefault(date.toString(), 0L));
            weekly.add(dayMap);
        }
        return weekly;
    }
}
