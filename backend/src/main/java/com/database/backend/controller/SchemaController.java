package com.database.backend.controller;

import com.database.backend.dto.ColumnDefinition;
import com.database.backend.dto.CreateTableRequest;
import com.database.backend.service.SchemaMetadataService;
import com.database.backend.service.SchemaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schema")
public class SchemaController {

    private final SchemaMetadataService schemaMetadataService;
    private final SchemaService schemaService;

    public SchemaController(SchemaMetadataService schemaMetadataService, SchemaService schemaService) {
        this.schemaMetadataService = schemaMetadataService;
        this.schemaService = schemaService;
    }

    @GetMapping("/tables")
    public List<Map<String, Object>> getTables() {
        return schemaMetadataService.getTables();
    }

    @GetMapping("/tables/{tableName}/columns")
    public List<Map<String, Object>> getTableColumns(@PathVariable String tableName) {
        return schemaMetadataService.getTableColumns(tableName);
    }

    @PostMapping("/tables")
    public ResponseEntity<?> createTable(@RequestBody CreateTableRequest request) {
        try {
            schemaService.createTable(request);
            return ResponseEntity.ok(Map.of("message", "Table created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/tables/{tableName}")
    public ResponseEntity<?> renameTable(@PathVariable String tableName, @RequestBody Map<String, String> body) {
        try {
            schemaService.renameTable(tableName, body.get("newName"));
            return ResponseEntity.ok(Map.of("message", "Table renamed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tables/{tableName}")
    public ResponseEntity<?> dropTable(@PathVariable String tableName) {
        try {
            schemaService.dropTable(tableName);
            return ResponseEntity.ok(Map.of("message", "Table dropped successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/tables/{tableName}/columns")
    public ResponseEntity<?> addColumn(@PathVariable String tableName, @RequestBody ColumnDefinition col) {
        try {
            schemaService.addColumn(tableName, col);
            return ResponseEntity.ok(Map.of("message", "Column added successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/tables/{tableName}/columns/{columnName}")
    public ResponseEntity<?> updateColumn(@PathVariable String tableName, @PathVariable String columnName, @RequestBody ColumnDefinition newDef) {
        try {
            if (!columnName.equals(newDef.getName())) {
                schemaService.renameColumn(tableName, columnName, newDef.getName());
            }
            schemaService.alterColumnProperties(tableName, newDef.getName(), newDef);
            return ResponseEntity.ok(Map.of("message", "Column updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tables/{tableName}/columns/{columnName}")
    public ResponseEntity<?> dropColumn(@PathVariable String tableName, @PathVariable String columnName) {
        try {
            schemaService.dropColumn(tableName, columnName);
            return ResponseEntity.ok(Map.of("message", "Column dropped successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Relationships
    @GetMapping("/tables/{tableName}/primary-key")
    public ResponseEntity<?> getPrimaryKey(@PathVariable String tableName) {
        Map<String, Object> pk = schemaMetadataService.getPrimaryKey(tableName);
        if (pk == null) return ResponseEntity.ok(null);
        return ResponseEntity.ok(pk);
    }

    @PostMapping("/tables/{tableName}/primary-key")
    public ResponseEntity<?> addPrimaryKey(@PathVariable String tableName, @RequestBody com.database.backend.dto.PrimaryKeyRequest req) {
        try {
            schemaService.addPrimaryKey(tableName, req.getColumns());
            return ResponseEntity.ok(Map.of("message", "Primary Key added"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tables/{tableName}/primary-key/{constraintName}")
    public ResponseEntity<?> dropPrimaryKey(@PathVariable String tableName, @PathVariable String constraintName) {
        try {
            schemaService.dropPrimaryKey(tableName, constraintName);
            return ResponseEntity.ok(Map.of("message", "Primary Key dropped"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tables/{tableName}/foreign-keys")
    public List<Map<String, Object>> getForeignKeys(@PathVariable String tableName) {
        return schemaMetadataService.getForeignKeys(tableName);
    }

    @PostMapping("/tables/{tableName}/foreign-keys")
    public ResponseEntity<?> addForeignKey(@PathVariable String tableName, @RequestBody com.database.backend.dto.ForeignKeyRequest req) {
        try {
            schemaService.addForeignKey(tableName, req);
            return ResponseEntity.ok(Map.of("message", "Foreign Key added"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tables/{tableName}/foreign-keys/{constraintName}")
    public ResponseEntity<?> dropForeignKey(@PathVariable String tableName, @PathVariable String constraintName) {
        try {
            schemaService.dropForeignKey(tableName, constraintName);
            return ResponseEntity.ok(Map.of("message", "Foreign Key dropped"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/relationships")
    public List<Map<String, Object>> getAllRelationships() {
        return schemaMetadataService.getAllRelationships();
    }
}
