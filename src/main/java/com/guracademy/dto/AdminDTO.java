package com.guracademy.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class AdminDTO {
    @NotNull(message = "admin_id cannot be null.")
    private String adminName;

    @NotNull(message = "admin_email cannot be null.")
    private String adminEmail;

    @NotNull(message = "admin_pass cannot be null.")
    private String adminPass;
}
