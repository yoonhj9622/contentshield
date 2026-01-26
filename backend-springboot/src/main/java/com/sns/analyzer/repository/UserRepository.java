// ==================== UserRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    List<User> findByStatus(User.UserStatus status);
    List<User> findByIsSuspended(Boolean isSuspended);
    List<User> findByIsFlagged(Boolean isFlagged);
    List<User> findByRole(User.UserRole role);
    Boolean existsByEmail(String email);
    boolean existsByUsername(String username); 
}