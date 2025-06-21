package com.guracademy.dto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import jakarta.validation.Validator;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import com.guracademy.test_utils.factory.AdminTestDataFactory;

import static org.junit.jupiter.api.Assertions.*;

public class AdminDTOTest {

    private Validator validator;
    private AdminDTO validAdminDTO;

    @BeforeEach
    public void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        validAdminDTO = AdminTestDataFactory.createValidAdminDTO();
    }

    @Test
    public void testValidAdminDTO() {
        Set<ConstraintViolation<AdminDTO>> violations = validator.validate(validAdminDTO);
        assertTrue(violations.isEmpty(), "Valid DTO should not have any validation errors");
    }

    @Test
    public void testNullFields() {
        AdminDTO nullFieldsDTO = AdminTestDataFactory.createAdminDTOWithNullFields();
        Set<ConstraintViolation<AdminDTO>> violations = validator.validate(nullFieldsDTO);
        assertFalse(violations.isEmpty(), "Null fields should cause validation errors");
        assertEquals(3, violations.size());
    }

    @Test
    public void testDifferentPassword() {
        AdminDTO differentPasswordDTO = AdminTestDataFactory.createAdminDTOWithDifferentPassword();
        Set<ConstraintViolation<AdminDTO>> violations = validator.validate(differentPasswordDTO);
        assertTrue(violations.isEmpty(), "Different password should be valid");
    }
}
