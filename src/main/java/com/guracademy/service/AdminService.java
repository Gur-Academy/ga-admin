package com.guracademy.service;

import com.guracademy.dto.AdminDTO;
import com.guracademy.dto.AdminResponseDTO;

import jakarta.validation.Valid;

public interface AdminService {
    AdminResponseDTO saveAdmin(@Valid AdminDTO adminDTO);
}
