package com.database.backend.controller;

import com.database.backend.service.QueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/query")
@CrossOrigin(origins = "*")
public class QueryController {

    private final QueryService queryService;

    public QueryController(QueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/execute")
    public ResponseEntity<?> executeQuery(@RequestBody QueryRequest req) {
        try {
            Map<String, Object> result = queryService.executeQuery(req.getSql(), req.getLimit());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            String msg = e.getMessage();
            if (e.getCause() != null) msg = e.getCause().getMessage();
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelQuery() {
        queryService.cancelQuery();
        return ResponseEntity.ok(Map.of("message", "Query cancelled"));
    }

    @GetMapping("/image/{uuid}")
    public ResponseEntity<byte[]> getImage(@PathVariable String uuid) {
        byte[] data = queryService.getCachedImage(uuid);
        if (data == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "image/png")
                .body(data);
    }
}
