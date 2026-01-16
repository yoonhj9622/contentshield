package com.contentshield.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public HealthController(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public String health() {
        return "ok";
    }

    @GetMapping("/hello")
    public String hello() {
        return "hello contentshield";
    }

    @GetMapping("/db-check")
    public String dbCheck() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return "DB Connection [sns_content_analyzer]: OK (Result: " + result + ")";
        } catch (Exception e) {
            return "DB Connection Error: " + e.getMessage();
        }
    }

    @GetMapping("/db-test")
    public String dbTest() {
        try {
            java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate
                    .queryForList("SELECT * FROM post_categories LIMIT 5");
            if (rows.isEmpty()) {
                return "Table 'post_categories' is empty or no such table.";
            }
            return "Data from post_categories: " + rows.toString();
        } catch (Exception e) {
            return "Error fetching data: " + e.getMessage();
        }
    }
}
