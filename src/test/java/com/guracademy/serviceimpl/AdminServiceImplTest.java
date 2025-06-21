package com.guracademy.serviceimpl;

import com.guracademy.dto.AdminDTO;
import com.guracademy.dto.AdminResponseDTO;
import com.guracademy.entity.Admin;
import com.guracademy.repository.AdminRepository;
import com.guracademy.service.AdminService;
import com.guracademy.test_utils.factory.AdminTestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.modelmapper.ModelMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private ModelMapper modelMapper;

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

        // Mock modelMapper
        when(modelMapper.map(any(AdminDTO.class), eq(Admin.class))).thenReturn(testAdmin);
        when(modelMapper.map(any(Admin.class), eq(AdminResponseDTO.class))).thenReturn(testResponseDTO);
    }

    @Test
    void testSaveAdmin_Success() {
        // Mock repository save
        when(adminRepository.save(any(Admin.class))).thenReturn(testAdmin);

        // Test
        AdminResponseDTO result = adminService.saveAdmin(testAdminDTO);

        // Verify
        assertNotNull(result);
        assertEquals(testResponseDTO.getAdminName(), result.getAdminName());
        assertEquals(testResponseDTO.getAdminEmail(), result.getAdminEmail());
        verify(adminRepository, times(1)).save(any(Admin.class));
    }


}
