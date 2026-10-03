package com.database.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "*")
public class SystemController {

    private final JdbcTemplate jdbcTemplate;

    public SystemController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        try {
            String dbName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
            String version = jdbcTemplate.queryForObject("SELECT version()", String.class);
            return ResponseEntity.ok(Map.of(
                "status", "Connected",
                "database", dbName,
                "version", version
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "Disconnected",
                "error", e.getMessage()
            ));
        }
    }
}
