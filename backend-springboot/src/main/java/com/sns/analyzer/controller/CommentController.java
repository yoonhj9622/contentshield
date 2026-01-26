package com.sns.analyzer.controller;

import com.sns.analyzer.entity.Comment;
import com.sns.analyzer.service.CommentService;
import com.sns.analyzer.service.UserService;
import lombok.RequiredArgsConstructor;
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

            if (url == null || url.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
            }

            Map<String, Object> result = commentService.crawlAndAnalyze(url, userId);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getComments(
            Authentication authentication,
            @RequestParam(required = false) String url) {
        try {
            Long userId = getUserId(authentication);
            System.out.println("[DEBUG] getComments called for userId: " + userId + ", url: " + url);
            List<Comment> comments = commentService.getComments(userId, url);
            System.out.println("[DEBUG] Found " + comments.size() + " comments");
            return ResponseEntity.ok(comments);
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

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        com.sns.analyzer.entity.User user = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getUserId();
    }
}
