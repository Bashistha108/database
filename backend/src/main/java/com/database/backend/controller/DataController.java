package com.database.backend.controller;

import com.database.backend.service.DataService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/data")
@CrossOrigin(origins = "*")
public class DataController {

    private final DataService dataService;

    public DataController(DataService dataService) {
        this.dataService = dataService;
    }

    @GetMapping("/{tableName}")
    public ResponseEntity<?> getTableData(
            @PathVariable String tableName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            return ResponseEntity.ok(dataService.getTableData(tableName, page, size));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{tableName}")
    public ResponseEntity<?> insertRow(@PathVariable String tableName, @RequestBody Map<String, Object> rowData) {
        try {
            dataService.insertRow(tableName, rowData);
            return ResponseEntity.ok(Map.of("message", "Row inserted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{tableName}")
    public ResponseEntity<?> updateRow(
            @PathVariable String tableName,
            @RequestBody UpdateDataRequest req) {
        try {
            dataService.updateRow(tableName, req.getPkValues(), req.getUpdateData());
            return ResponseEntity.ok(Map.of("message", "Row updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{tableName}")
    public ResponseEntity<?> deleteRow(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> pkValues) {
        try {
            dataService.deleteRow(tableName, pkValues);
            return ResponseEntity.ok(Map.of("message", "Row deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{tableName}/image/{columnName}")
    public ResponseEntity<byte[]> getImageData(
            @PathVariable String tableName,
            @PathVariable String columnName,
            @RequestBody Map<String, Object> pkValues) {
        try {
            byte[] image = dataService.getImageData(tableName, columnName, pkValues);
            if (image == null) return ResponseEntity.notFound().build();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG); // Or probe content type, for MVP jpeg/png is fine
            return new ResponseEntity<>(image, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{tableName}/next-id")
    public ResponseEntity<Map<String, Long>> getNextId(@PathVariable String tableName) {
        Long nextId = dataService.getNextId(tableName);
        return ResponseEntity.ok(Map.of("nextId", nextId != null ? nextId : 0L));
    }
}
