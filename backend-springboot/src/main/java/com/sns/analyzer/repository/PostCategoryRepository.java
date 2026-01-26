// ==================== PostCategoryRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.PostCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostCategoryRepository extends JpaRepository<PostCategory, Long> {
    Optional<PostCategory> findByCategoryName(String categoryName);
    List<PostCategory> findByIsActive(Boolean isActive);
    Boolean existsByCategoryName(String categoryName);
}