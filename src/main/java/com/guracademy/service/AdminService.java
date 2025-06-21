package com.guracademy.service;

import com.guracademy.dto.AdminDTO;
import com.guracademy.dto.AdminResponseDTO;

import jakarta.validation.Valid;

import java.util.UUID;

public interface AdminService {
    AdminResponseDTO saveAdmin(@Valid AdminDTO adminDTO);
    AdminResponseDTO getAdminById(UUID adminId);
}
