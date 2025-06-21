package com.guracademy.serviceimpl;

import com.common.util.PasswordUtil;
import com.guracademy.dto.AdminDTO;
import com.guracademy.dto.AdminResponseDTO;
import com.guracademy.entity.Admin;
import com.guracademy.exception.AdminNotFoundException;
import com.guracademy.repository.AdminRepository;
import com.guracademy.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.log4j.Logger;
import org.modelmapper.ModelMapper;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.persistence.OptimisticLockException;

import java.util.UUID;

/**
 * Service implementation for admin management operations.
 */
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;
    private final ModelMapper modelMapper;
    private static final Logger logger = Logger.getLogger(AdminServiceImpl.class);

    @Override
    @Transactional
    public AdminResponseDTO saveAdmin(@Valid AdminDTO requestDTO) {
            Admin admin = modelMapper.map(requestDTO, Admin.class);
            admin.setAdminPass(PasswordUtil.hashPassword(requestDTO.getAdminPass()));

            Admin savedAdmin = adminRepository.save(admin);
            logger.info("Successfully saved admin with ID: " + savedAdmin.getAdminId());

            // Now map back to response DTO that doesn't include password
            return modelMapper.map(savedAdmin, AdminResponseDTO.class);
    }

    @Override
    public AdminResponseDTO getAdminById(UUID adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new AdminNotFoundException(adminId));
        
        logger.info("Retrieved admin profile with ID: " + adminId);
        return modelMapper.map(admin, AdminResponseDTO.class);
    }
}
