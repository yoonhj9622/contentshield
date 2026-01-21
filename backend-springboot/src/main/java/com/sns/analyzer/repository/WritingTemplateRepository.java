// ==================== WritingTemplateRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.WritingTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WritingTemplateRepository extends JpaRepository<WritingTemplate, Long> {
    List<WritingTemplate> findByUserId(Long userId);
    List<WritingTemplate> findByIsPublic(Boolean isPublic);
    List<WritingTemplate> findByCategory(String category);
    List<WritingTemplate> findByUserIdOrIsPublic(Long userId, Boolean isPublic);
}