package com.guracademy.serviceimpl;

import com.common.util.PasswordUtil;
import com.guracademy.dto.AdminDTO;
import com.guracademy.dto.AdminResponseDTO;
import com.guracademy.entity.Admin;
import com.guracademy.exception.AdminNotFoundException;
import com.guracademy.repository.AdminRepository;
import com.guracademy.test_utils.factory.AdminTestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private PasswordUtil passwordUtil;

    @InjectMocks
    private AdminServiceImpl adminService;

    private AdminDTO testAdminDTO;
    private Admin testAdmin;
    private AdminResponseDTO testResponseDTO;

    @BeforeEach
    void setUp() {
        testAdminDTO = AdminTestDataFactory.createValidAdminDTO();
        testAdmin = AdminTestDataFactory.createValidAdmin();
        testResponseDTO = AdminResponseDTO.builder()
                .adminName(testAdminDTO.getAdminName())
                .adminEmail(testAdminDTO.getAdminEmail())
                .build();
    }

    @Test
    void testSaveAdmin_Success() {
        // Given
        String hashedPassword = "hashedPassword";
        UUID adminId = UUID.randomUUID();
        try (MockedStatic<PasswordUtil> passwordUtilMock = mockStatic(PasswordUtil.class)) {
            passwordUtilMock.when(() -> PasswordUtil.hashPassword(testAdminDTO.getAdminPass()))
                    .thenReturn(hashedPassword);
            
            // Create real admin objects for proper mapping
            Admin admin = AdminTestDataFactory.createValidAdmin();
            admin.setAdminPass(hashedPassword);
            admin.setAdminId(adminId);
            
            // Mock modelMapper to return the real admin object
            when(modelMapper.map(testAdminDTO, Admin.class)).thenReturn(admin);
            when(adminRepository.save(admin)).thenReturn(admin);
            when(modelMapper.map(admin, AdminResponseDTO.class)).thenReturn(testResponseDTO);
            
            // When
            AdminResponseDTO response = adminService.saveAdmin(testAdminDTO);

            // Then
            assertNotNull(response);
            assertEquals(testResponseDTO.getAdminName(), response.getAdminName());
            assertEquals(testResponseDTO.getAdminEmail(), response.getAdminEmail());
            verify(modelMapper).map(testAdminDTO, Admin.class);
            passwordUtilMock.verify(() -> PasswordUtil.hashPassword(testAdminDTO.getAdminPass()));
            verify(adminRepository).save(admin);
            verify(modelMapper).map(admin, AdminResponseDTO.class);
        }
    }

    @Test
    void testGetAdminById_Success() {
        // Given
        UUID adminId = testAdmin.getAdminId();
        when(adminRepository.findById(adminId)).thenReturn(java.util.Optional.of(testAdmin));
        when(modelMapper.map(testAdmin, AdminResponseDTO.class)).thenReturn(testResponseDTO);

        // When
        AdminResponseDTO response = adminService.getAdminById(adminId);

        // Then
        assertNotNull(response);
        assertEquals(testResponseDTO.getAdminName(), response.getAdminName());
        assertEquals(testResponseDTO.getAdminEmail(), response.getAdminEmail());
        verify(adminRepository).findById(adminId);
        verify(modelMapper).map(testAdmin, AdminResponseDTO.class);
    }

    @Test
    void testGetAdminById_NotFound() {
        // Given
        UUID invalidAdminId = UUID.randomUUID();
        when(adminRepository.findById(invalidAdminId)).thenReturn(java.util.Optional.empty());

        // When & Then
        AdminNotFoundException exception = assertThrows(AdminNotFoundException.class,
                () -> adminService.getAdminById(invalidAdminId));
        
        assertEquals("Admin with ID " + invalidAdminId + " not found", exception.getMessage());
        verify(adminRepository).findById(invalidAdminId);
    }
}


