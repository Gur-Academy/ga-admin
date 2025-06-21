package com.guracademy.controller;

import com.guracademy.dto.AdminDTO;
import com.guracademy.dto.AdminResponseDTO;
import com.guracademy.exception.AdminNotFoundException;
import com.guracademy.service.AdminService;
import com.guracademy.test_utils.factory.AdminTestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    private ModelMapper modelMapper;
    private AdminDTO validAdminDTO;
    private AdminResponseDTO validAdminResponseDTO;
    private UUID validAdminId;

    @BeforeEach
    void setUp() {
        modelMapper = new ModelMapper();
        validAdminDTO = AdminTestDataFactory.createValidAdminDTO();
        validAdminResponseDTO = modelMapper.map(validAdminDTO, AdminResponseDTO.class);
        validAdminId = UUID.randomUUID();
    }

    @Test
    void testCreateAdminProfile_Success() {
        // Given
        when(adminService.saveAdmin(any(AdminDTO.class))).thenReturn(validAdminResponseDTO);

        // When
        ResponseEntity<AdminResponseDTO> response = adminController.createAdminProfile(validAdminDTO);

        // Then
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(validAdminResponseDTO.getAdminName(), response.getBody().getAdminName());
        assertEquals(validAdminResponseDTO.getAdminEmail(), response.getBody().getAdminEmail());
    }

    @Test
    void testGetAdminProfile_Success() {
        // Given
        when(adminService.getAdminById(validAdminId)).thenReturn(validAdminResponseDTO);

        // When
        ResponseEntity<AdminResponseDTO> response = adminController.getAdminProfile(validAdminId);

        // Then
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(validAdminResponseDTO.getAdminName(), response.getBody().getAdminName());
        assertEquals(validAdminResponseDTO.getAdminEmail(), response.getBody().getAdminEmail());
    }

    @Test
    void testGetAdminProfile_NotFound() {
        // Given
        UUID invalidAdminId = UUID.randomUUID();
        when(adminService.getAdminById(invalidAdminId))
                .thenThrow(new AdminNotFoundException(invalidAdminId));

        // When & Then
        assertThrows(AdminNotFoundException.class, 
            () -> adminController.getAdminProfile(invalidAdminId));
    }
}
    


