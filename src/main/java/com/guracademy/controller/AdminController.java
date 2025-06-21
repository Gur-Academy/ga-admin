package com.guracademy.controller;

import com.guracademy.dto.AdminDTO;
import com.guracademy.dto.AdminResponseDTO;
import com.guracademy.service.AdminService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Operations related to admin profile management")
@Slf4j
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/createAdminProfile")
    public ResponseEntity<AdminResponseDTO> createAdminProfile(@RequestBody AdminDTO requestDTO) {
        AdminResponseDTO responseDTO = adminService.saveAdmin(requestDTO);
        return ResponseEntity.ok(responseDTO);
    }

    @GetMapping("/{adminId}")
    public ResponseEntity<AdminResponseDTO> getAdminProfile(@PathVariable UUID adminId) {
        AdminResponseDTO responseDTO = adminService.getAdminById(adminId);
        return ResponseEntity.ok(responseDTO);
    }
}
