// ==================== SnsAnalyzerApplication.java ====================
// 위치: src/main/java/com/sns/analyzer/SnsAnalyzerApplication.java
package com.sns.analyzer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SnsAnalyzerApplication {

	public static void main(String[] args) {
		SpringApplication.run(SnsAnalyzerApplication.class, args);
	}

}