package com.guracademy.repository;

import com.guracademy.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, UUID> {
    
    boolean existsByAdminEmail(String adminEmail);
}
