package com.guracademy.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ErrorResponseDTO {
    private int status;
    private String message;
    private String timestamp;
}
