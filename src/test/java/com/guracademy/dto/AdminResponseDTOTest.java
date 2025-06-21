package com.guracademy.dto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;
import static jakarta.validation.Validation.buildDefaultValidatorFactory;
import com.guracademy.test_utils.factory.AdminTestDataFactory;

public class AdminResponseDTOTest {

    private Validator validator;
    private AdminResponseDTO validAdminResponseDTO;

    @BeforeEach
    public void setUp() {
        ValidatorFactory factory = buildDefaultValidatorFactory();
        validator = factory.getValidator();
        validAdminResponseDTO = AdminTestDataFactory.createValidAdminResponseDTO();
    }

    @Test
    public void testValidAdminResponseDTO() {
        Set<ConstraintViolation<AdminResponseDTO>> violations = validator.validate(validAdminResponseDTO);
        assertTrue(violations.isEmpty(), "Valid DTO should not have any validation errors");
    }

    @Test
    public void testNullFields() {
        AdminResponseDTO nullFieldsDTO = AdminTestDataFactory.createAdminResponseDTOWithNullFields();
        Set<ConstraintViolation<AdminResponseDTO>> violations = validator.validate(nullFieldsDTO);
        assertFalse(violations.isEmpty(), "Null fields should cause validation errors");
        assertEquals(2, violations.size());
    }

    @Test
    public void testBuilder() {
        AdminResponseDTO responseDTO = AdminTestDataFactory.createValidAdminResponseDTO();
        assertNotNull(responseDTO);
        assertEquals(AdminTestDataFactory.VALID_ADMIN_NAME, responseDTO.getAdminName());
        assertEquals(AdminTestDataFactory.VALID_ADMIN_EMAIL, responseDTO.getAdminEmail());
    }

    @Test
    public void testGettersAndSetters() {
        AdminResponseDTO responseDTO = new AdminResponseDTO();
        
        String adminName = AdminTestDataFactory.VALID_ADMIN_NAME;
        String adminEmail = AdminTestDataFactory.VALID_ADMIN_EMAIL;

        responseDTO.setAdminName(adminName);
        responseDTO.setAdminEmail(adminEmail);

        assertEquals(adminName, responseDTO.getAdminName());
        assertEquals(adminEmail, responseDTO.getAdminEmail());
    }

    @Test
    public void testNoArgsConstructor() {
        AdminResponseDTO responseDTO = new AdminResponseDTO();
        assertNotNull(responseDTO);
    }

    @Test
    public void testAllArgsConstructor() {
        AdminResponseDTO responseDTO = AdminTestDataFactory.createValidAdminResponseDTO();
        assertNotNull(responseDTO);
        assertEquals(AdminTestDataFactory.VALID_ADMIN_NAME, responseDTO.getAdminName());
        assertEquals(AdminTestDataFactory.VALID_ADMIN_EMAIL, responseDTO.getAdminEmail());
        assertEquals(responseDTO.getAdminName(), AdminTestDataFactory.VALID_ADMIN_NAME);
        assertEquals(responseDTO.getAdminEmail(), AdminTestDataFactory.VALID_ADMIN_EMAIL);
    }
}
