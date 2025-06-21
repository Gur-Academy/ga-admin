package com.guracademy.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class AdminResponseDTO {
    @NotEmpty(message = "admin_name cannot be empty")
    private String adminName;

    @NotEmpty(message = "admin_email cannot be empty")
    private String adminEmail;
}
