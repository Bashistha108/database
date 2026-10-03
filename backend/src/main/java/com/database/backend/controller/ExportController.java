package com.database.backend.controller;

import com.database.backend.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/api/export")
@CrossOrigin
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping
    public ResponseEntity<StreamingResponseBody> exportData(@RequestBody ExportRequest req) {
        StreamingResponseBody stream = out -> {
            exportService.exportData(req.getType(), req.getSource(), req.getFormat(), out);
        };

        String filename = "export." + req.getFormat().toLowerCase();
        MediaType mediaType;
        switch (req.getFormat().toLowerCase()) {
            case "csv":
                mediaType = MediaType.parseMediaType("text/csv");
                break;
            case "xlsx":
                mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                break;
            case "json":
                mediaType = MediaType.APPLICATION_JSON;
                break;
            default:
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(stream);
    }
}
