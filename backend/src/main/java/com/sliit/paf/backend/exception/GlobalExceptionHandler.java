package com.sliit.paf.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        String message = ex.getMessage() == null ? "Runtime error" : ex.getMessage();
        HttpStatus status = message.contains("not found") ? HttpStatus.NOT_FOUND :
                            message.contains("Unauthorized") ? HttpStatus.FORBIDDEN :
                            HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "error", status.getReasonPhrase(),
                "message", message
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "error", "Internal Server Error",
                "message", "An unexpected error occurred"
        ));
    }
}
