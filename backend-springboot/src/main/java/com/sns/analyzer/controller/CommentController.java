package com.sns.analyzer.controller;

import com.sns.analyzer.entity.Comment;
import com.sns.analyzer.service.CommentService;
import com.sns.analyzer.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserService userService;

    @PostMapping("/crawl")
    public ResponseEntity<?> crawlAndAnalyze(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        try {
            Long userId = getUserId(authentication);
            String url = request.get("url");
            String startDate = request.get("startDate");
            String endDate = request.get("endDate");

            if (url == null || url.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
            }

            Map<String, Object> result = commentService.crawlAndAnalyze(url, userId, startDate, endDate);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getComments(
            Authentication authentication,
            @RequestParam(required = false) String url,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Long userId = getUserId(authentication);
            System.out.println("[DEBUG] getComments called for userId: " + userId + ", url: " + url + ", period: "
                    + startDate + "~" + endDate + ", status: " + status + ", page: " + page + ", size: " + size);

            Boolean isMalicious = null;
            if ("malicious".equalsIgnoreCase(status)) {
                isMalicious = true;
            } else if ("clean".equalsIgnoreCase(status)) {
                isMalicious = false;
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by("commentedAt").descending());
            return ResponseEntity
                    .ok(commentService.getComments(userId, url, startDate, endDate, isMalicious, pageable));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        try {
            commentService.deleteComment(commentId);
            return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/delete-batch")
    public ResponseEntity<?> deleteComments(@RequestBody List<Long> commentIds) {
        try {
            commentService.deleteComments(commentIds);
            return ResponseEntity.ok(Map.of("message", "Deleted " + commentIds.size() + " comments successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<?> deleteAllComments(Authentication authentication,
            @RequestParam(required = false) String url) {
        try {
            Long userId = getUserId(authentication);
            commentService.deleteAllComments(userId, url);
            return ResponseEntity.ok(Map.of("message", "Deleted all comments successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        com.sns.analyzer.entity.User user = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }
}
