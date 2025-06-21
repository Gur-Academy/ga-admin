package com.guracademy.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.UUID;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class GlobalExceptionHandlerTest {

    @Test
    void testHandleAdminNotFoundException() {
        // Given
        UUID adminId = UUID.randomUUID();
        AdminNotFoundException exception = new AdminNotFoundException(adminId);
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        // When
        ResponseEntity<String> response = handler.handleAdminNotFoundException(exception);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(exception.getMessage(), response.getBody());
    }

}
