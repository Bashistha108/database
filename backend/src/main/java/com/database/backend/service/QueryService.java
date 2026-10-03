package com.database.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class QueryService {

    private final JdbcTemplate jdbcTemplate;
    private volatile Statement currentStatement;
    private static final Pattern DANGEROUS_SQL = Pattern.compile(
        "(?i)\\b(DROP\\s+DATABASE|DROP\\s+SCHEMA|GRANT|REVOKE|ALTER\\s+SYSTEM|ALTER\\s+USER|ALTER\\s+ROLE)\\b"
    );

    private final Map<String, byte[]> imageCache = java.util.Collections.synchronizedMap(
        new java.util.LinkedHashMap<String, byte[]>(100, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
                return size() > 100;
            }
        }
    );

    public byte[] getCachedImage(String uuid) {
        return imageCache.get(uuid);
    }

    public QueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void cancelQuery() {
        Statement stmt = this.currentStatement;
        if (stmt != null) {
            try {
                stmt.cancel();
            } catch (Exception e) {
                // Ignore cancellation errors
            }
        }
    }

    public Map<String, Object> executeQuery(String sql, int limit) {
        if (DANGEROUS_SQL.matcher(sql).find()) {
            throw new IllegalArgumentException("Dangerous SQL commands are blocked for your safety.");
        }

        return jdbcTemplate.execute((java.sql.Connection con) -> {
            try (Statement stmt = con.createStatement()) {
                this.currentStatement = stmt;
                try {
                    // Protect non-user schemas by forcing search_path
                    stmt.execute("SET search_path TO user_data, public");
                    
                    if (limit > 0) {
                        stmt.setMaxRows(limit);
                    }

                    boolean hasResultSet = stmt.execute(sql);
                    
                    Map<String, Object> response = new HashMap<>();
                    
                    if (hasResultSet) {
                        try (ResultSet rs = stmt.getResultSet()) {
                            ResultSetMetaData rsmd = rs.getMetaData();
                            int columnCount = rsmd.getColumnCount();
                            
                            List<String> columns = new ArrayList<>();
                            List<String> columnTypes = new ArrayList<>();
                            for (int i = 1; i <= columnCount; i++) {
                                columns.add(rsmd.getColumnLabel(i));
                                columnTypes.add(rsmd.getColumnTypeName(i));
                            }
                            
                            List<Map<String, Object>> rows = new ArrayList<>();
                            while (rs.next()) {
                                Map<String, Object> row = new HashMap<>();
                                for (int i = 1; i <= columnCount; i++) {
                                    Object val = rs.getObject(i);
                                    if (val instanceof byte[]) {
                                        String uuid = java.util.UUID.randomUUID().toString();
                                        imageCache.put(uuid, (byte[]) val);
                                        row.put(columns.get(i - 1), "[BINARY DATA:" + uuid + "]");
                                    } else {
                                        row.put(columns.get(i - 1), val);
                                    }
                                }
                                rows.add(row);
                            }
                            
                            response.put("type", "DATA");
                            response.put("columns", columns);
                            response.put("columnTypes", columnTypes);
                            response.put("rows", rows);
                            response.put("message", "Returned " + rows.size() + " rows");
                        }
                    } else {
                        int updateCount = stmt.getUpdateCount();
                        response.put("type", "UPDATE");
                        response.put("message", "Success. " + updateCount + " rows affected.");
                    }
                    
                    return response;
                } finally {
                    this.currentStatement = null;
                }
            }
        });
    }
}
