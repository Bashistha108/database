package com.database.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DataService {

    private final JdbcTemplate jdbcTemplate;
    private final SchemaMetadataService schemaMetadataService;

    public DataService(JdbcTemplate jdbcTemplate, SchemaMetadataService schemaMetadataService) {
        this.jdbcTemplate = jdbcTemplate;
        this.schemaMetadataService = schemaMetadataService;
    }

    private String quote(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }

    public Map<String, Object> getTableData(String tableName, int page, int size) {
        // Find columns to handle BYTEA
        List<Map<String, Object>> columns = schemaMetadataService.getTableColumns(tableName);
        
        StringBuilder selectClause = new StringBuilder();
        for (int i = 0; i < columns.size(); i++) {
            String colName = (String) columns.get(i).get("name");
            String colType = (String) columns.get(i).get("type");
            
            if (colType.equalsIgnoreCase("bytea")) {
                selectClause.append("CASE WHEN ").append(quote(colName)).append(" IS NOT NULL THEN '[BYTEA]' ELSE NULL END AS ").append(quote(colName));
            } else {
                selectClause.append(quote(colName));
            }
            if (i < columns.size() - 1) selectClause.append(", ");
        }
        
        if (selectClause.length() == 0) selectClause.append("*");

        String countSql = "SELECT COUNT(*) FROM user_data." + quote(tableName);
        Integer totalRows = jdbcTemplate.queryForObject(countSql, Integer.class);
        if (totalRows == null) totalRows = 0;

        String dataSql = "SELECT " + selectClause + " FROM user_data." + quote(tableName) + " LIMIT ? OFFSET ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(dataSql, size, page * size);

        return Map.of(
            "content", rows,
            "totalElements", totalRows,
            "totalPages", (int) Math.ceil((double) totalRows / size),
            "page", page,
            "size", size
        );
    }

    private void parseByteaColumns(String tableName, Map<String, Object> data) {
        List<Map<String, Object>> columnsInfo = schemaMetadataService.getTableColumns(tableName);
        for (Map<String, Object> col : columnsInfo) {
            String colName = (String) col.get("name");
            String colType = (String) col.get("type");
            if ("bytea".equalsIgnoreCase(colType) && data.containsKey(colName)) {
                Object val = data.get(colName);
                if (val instanceof String && ((String) val).startsWith("data:")) {
                    String[] parts = ((String) val).split(",");
                    if (parts.length == 2) {
                        data.put(colName, java.util.Base64.getDecoder().decode(parts[1]));
                    }
                } else if (val instanceof String && "[BYTEA]".equals(val)) {
                    data.remove(colName);
                }
            }
        }
    }

    public void insertRow(String tableName, Map<String, Object> rowData) {
        if (rowData.isEmpty()) return;
        parseByteaColumns(tableName, rowData);

        // Auto-generate missing single-column integer primary keys if not provided
        try {
            Map<String, Object> pkInfo = schemaMetadataService.getPrimaryKey(tableName);
            if (pkInfo != null) {
                @SuppressWarnings("unchecked")
                List<String> pkCols = (List<String>) pkInfo.get("columns");
                if (pkCols != null && pkCols.size() == 1) {
                    String pkCol = pkCols.get(0);
                    Object val = rowData.get(pkCol);
                    if (val == null || val.toString().trim().isEmpty()) {
                        List<Map<String, Object>> columnsInfo = schemaMetadataService.getTableColumns(tableName);
                        boolean isInteger = columnsInfo.stream()
                            .anyMatch(c -> pkCol.equals(c.get("name")) && String.valueOf(c.get("type")).toLowerCase().contains("int"));
                        if (isInteger) {
                            String maxSql = "SELECT COALESCE(MAX(" + quote(pkCol) + "), 0) + 1 FROM user_data." + quote(tableName);
                            Long nextId = jdbcTemplate.queryForObject(maxSql, Long.class);
                            rowData.put(pkCol, nextId);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Ignore if PK logic fails
        }

        List<Map<String, Object>> columnsInfo = schemaMetadataService.getTableColumns(tableName);
        rowData.entrySet().removeIf(entry -> {
            if (entry.getValue() == null) return true;
            if (entry.getValue().toString().trim().isEmpty()) {
                boolean isIntOrNumeric = columnsInfo.stream().anyMatch(c -> entry.getKey().equals(c.get("name")) && 
                    (String.valueOf(c.get("type")).toLowerCase().contains("int") || String.valueOf(c.get("type")).toLowerCase().contains("numeric")));
                return isIntOrNumeric;
            }
            return false;
        });

        String columns = rowData.keySet().stream().map(this::quote).collect(Collectors.joining(", "));
        String placeholders = rowData.keySet().stream().map(k -> "?").collect(Collectors.joining(", "));
        Object[] values = rowData.values().toArray();

        String sql = "INSERT INTO user_data." + quote(tableName) + " (" + columns + ") VALUES (" + placeholders + ")";
        jdbcTemplate.update(sql, values);
    }

    public void updateRow(String tableName, Map<String, Object> pkValues, Map<String, Object> updateData) {
        if (updateData.isEmpty() || pkValues.isEmpty()) return;
        parseByteaColumns(tableName, updateData);

        String setClause = updateData.keySet().stream()
            .map(k -> quote(k) + " = ?")
            .collect(Collectors.joining(", "));
            
        String whereClause = pkValues.keySet().stream()
            .map(k -> quote(k) + " = ?")
            .collect(Collectors.joining(" AND "));

        Object[] values = new Object[updateData.size() + pkValues.size()];
        int idx = 0;
        for (Object v : updateData.values()) values[idx++] = v;
        for (Object v : pkValues.values()) values[idx++] = v;

        String sql = "UPDATE user_data." + quote(tableName) + " SET " + setClause + " WHERE " + whereClause;
        jdbcTemplate.update(sql, values);
    }

    public void deleteRow(String tableName, Map<String, Object> pkValues) {
        if (pkValues.isEmpty()) throw new IllegalArgumentException("Cannot delete without primary key");

        String whereClause = pkValues.keySet().stream()
            .map(k -> quote(k) + " = ?")
            .collect(Collectors.joining(" AND "));

        Object[] values = pkValues.values().toArray();

        String sql = "DELETE FROM user_data." + quote(tableName) + " WHERE " + whereClause;
        jdbcTemplate.update(sql, values);
    }

    public byte[] getImageData(String tableName, String columnName, Map<String, Object> pkValues) {
        String whereClause = pkValues.keySet().stream()
            .map(k -> quote(k) + " = ?")
            .collect(Collectors.joining(" AND "));
            
        String sql = "SELECT " + quote(columnName) + " FROM user_data." + quote(tableName) + " WHERE " + whereClause;
        return jdbcTemplate.queryForObject(sql, byte[].class, pkValues.values().toArray());
    }

    public Long getNextId(String tableName) {
        try {
            Map<String, Object> pkInfo = schemaMetadataService.getPrimaryKey(tableName);
            if (pkInfo != null) {
                @SuppressWarnings("unchecked")
                List<String> pkCols = (List<String>) pkInfo.get("columns");
                if (pkCols != null && pkCols.size() == 1) {
                    String pkCol = pkCols.get(0);
                    List<Map<String, Object>> columnsInfo = schemaMetadataService.getTableColumns(tableName);
                    boolean isInteger = columnsInfo.stream()
                        .anyMatch(c -> pkCol.equals(c.get("name")) && String.valueOf(c.get("type")).toLowerCase().contains("int"));
                    if (isInteger) {
                        String maxSql = "SELECT COALESCE(MAX(" + quote(pkCol) + "), 0) + 1 FROM user_data." + quote(tableName);
                        return jdbcTemplate.queryForObject(maxSql, Long.class);
                    }
                }
            }
        } catch (Exception e) {}
        return null;
    }
}
