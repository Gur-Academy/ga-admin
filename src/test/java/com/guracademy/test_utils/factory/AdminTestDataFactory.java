package com.guracademy.test_utils.factory;

import com.guracademy.dto.AdminDTO;
import com.guracademy.dto.AdminResponseDTO;
import com.guracademy.entity.Admin;
import java.util.UUID;

public class AdminTestDataFactory {

    public static final String VALID_ADMIN_NAME = "Test Admin";
    public static final String VALID_ADMIN_EMAIL = "test.admin@example.com";
    public static final String VALID_ADMIN_PASSWORD = "Test@123";
    public static final String INVALID_EMAIL = "invalid-email";
    public static final String DIFFERENT_PASSWORD = "Different@123";

    public static AdminDTO createValidAdminDTO() {
        return AdminDTO.builder()
                .adminName(VALID_ADMIN_NAME)
                .adminEmail(VALID_ADMIN_EMAIL)
                .adminPass(VALID_ADMIN_PASSWORD)
                .build();
    }

    public static Admin createValidAdmin() {
        return Admin.builder()
                .adminId(UUID.randomUUID())
                .adminName(VALID_ADMIN_NAME)
                .adminEmail(VALID_ADMIN_EMAIL)
                .adminPass(VALID_ADMIN_PASSWORD)
                .build();
    }

    public static AdminDTO createAdminDTOWithInvalidEmail() {
        return AdminDTO.builder()
                .adminName(VALID_ADMIN_NAME)
                .adminEmail(INVALID_EMAIL)
                .adminPass(VALID_ADMIN_PASSWORD)
                .build();
    }

    public static AdminDTO createAdminDTOWithNullFields() {
        return AdminDTO.builder()
                .adminName(null)
                .adminEmail(null)
                .adminPass(null)
                .build();
    }

    public static AdminDTO createAdminDTOWithDifferentPassword() {
        return AdminDTO.builder()
                .adminName(VALID_ADMIN_NAME)
                .adminEmail(VALID_ADMIN_EMAIL)
                .adminPass(DIFFERENT_PASSWORD)
                .build();
    }

    public static Admin createAdminWithDifferentPassword() {
        return Admin.builder()
                .adminId(UUID.randomUUID())
                .adminName(VALID_ADMIN_NAME)
                .adminEmail(VALID_ADMIN_EMAIL)
                .adminPass(DIFFERENT_PASSWORD)
                .build();
    }

    public static AdminResponseDTO createValidAdminResponseDTO() {
        return AdminResponseDTO.builder()
                .adminName(VALID_ADMIN_NAME)
                .adminEmail(VALID_ADMIN_EMAIL)
                .build();
    }

    public static AdminResponseDTO createAdminResponseDTOWithNullFields() {
        return AdminResponseDTO.builder()
                .adminName(null)
                .adminEmail(null)
                .build();
    }

    public static AdminResponseDTO createAdminResponseDTOWithDifferentEmail() {
        return AdminResponseDTO.builder()
                .adminName(VALID_ADMIN_NAME)
                .adminEmail("different.email@example.com")
                .build();
    }
}
