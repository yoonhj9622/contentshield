package com.sns.analyzer.service;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final AnalysisService analysisService;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    /**
     * 유튜브 댓글 크롤링 및 분석
     */
    public Map<String, Object> crawlAndAnalyze(String url, Long userId) {
        System.out.println("[DEBUG] crawlAndAnalyze called for URL: " + url + ", userId: " + userId);
        // 1. Python AI 서버에 크롤링 요청
        List<Map<String, Object>> crawledComments = crawlYoutubeComments(url);

        int successCount = 0;
        int failCount = 0;

        List<AnalysisResult> results = new ArrayList<>();

        // 2. DB 저장 및 분석
        for (Map<String, Object> c : crawledComments) {
            try {
                String text = (String) c.get("text");
                String author = (String) c.get("author");
                String externalId = (String) c.get("external_id");
                // String publishDate = (String) c.get("publish_date");

                if (text == null || text.trim().isEmpty())
                    continue;

                // 중복 체크: 이미 저장된 댓글이면 건너뜀
                if (externalId != null && !externalId.isEmpty()
                        && commentRepository.existsByExternalCommentId(externalId)) {
                    System.out.println("[DEBUG] Skipping existing comment: " + externalId);
                    continue;
                }

                // 댓글 저장
                Comment comment = Comment.builder()
                        .userId(userId)
                        .platform("YOUTUBE")
                        .contentUrl(url)
                        .authorName(author) // 필수 필드 설정
                        .authorIdentifier(author)
                        .externalCommentId(
                                externalId != null && !externalId.isEmpty() ? externalId : UUID.randomUUID().toString())
                        .commentText(text)
                        .commentedAt(LocalDateTime.now().withNano(0)) // 날짜 절삭
                        .isAnalyzed(false)
                        .isMalicious(false)
                        .createdAt(LocalDateTime.now().withNano(0)) // 날짜 절삭
                        .build();

                Comment savedComment = commentRepository.save(comment);

                // 분석 수행
                AnalysisResult result = analysisService.analyzeComment(savedComment.getCommentId(), userId);
                results.add(result);
                successCount++;

            } catch (Exception e) {
                failCount++;
                e.printStackTrace();
            }
        }

        return Map.of(
                "totalCrawled", crawledComments.size(),
                "analyzedCount", successCount,
                "failCount", failCount,
                "results", results);
    }

    /**
     * Python 크롤러 호출
     */
    private List<Map<String, Object>> crawlYoutubeComments(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> request = Map.of("url", url);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    aiServiceUrl + "/crawl/youtube",
                    HttpMethod.POST,
                    entity,
                    Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && "success".equals(body.get("status"))) {
                return (List<Map<String, Object>>) body.get("comments");
            }

            return List.of();

        } catch (Exception e) {
            throw new RuntimeException("Crawling failed: " + e.getMessage());
        }
    }

    /**
     * 댓글 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Comment> getComments(Long userId, String url) {
        if (url != null && !url.isEmpty()) {
            return commentRepository.findByUserIdAndContentUrl(userId, url);
        }
        return commentRepository.findByUserId(userId);
    }

    /**
     * 댓글 삭제
     */
    @Transactional
    public void deleteComment(Long commentId) {
        commentRepository.deleteById(commentId);
    }
}
