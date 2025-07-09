package com.guracademy.exception;

import java.util.UUID;

public class AdminNotFoundException extends RuntimeException{
    public AdminNotFoundException(UUID adminId) {
        super("Admin with ID " + adminId + " not foun");
    }
}
