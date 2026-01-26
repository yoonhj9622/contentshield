// ==================== UserProfileRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUserId(Long userId);
    Boolean existsByUserId(Long userId);
}