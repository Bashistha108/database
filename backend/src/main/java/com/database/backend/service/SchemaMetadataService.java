package com.database.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class SchemaMetadataService {

    private final JdbcTemplate jdbcTemplate;

    public SchemaMetadataService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getTables() {
        String sql = "SELECT " +
                     "  t.table_name as \"tableName\", " +
                     "  t.table_schema as \"schema\", " +
                     "  (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = t.table_schema) as \"columns\" " +
                     "FROM information_schema.tables t " +
                     "WHERE t.table_schema = 'user_data' AND t.table_type = 'BASE TABLE'";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getTableColumns(String tableName) {
        String sql = "SELECT " +
                     "  column_name as \"name\", " +
                     "  data_type as \"type\", " +
                     "  is_nullable as \"nullable\", " +
                     "  column_default as \"defaultValue\" " +
                     "FROM information_schema.columns " +
                     "WHERE table_schema = 'user_data' AND table_name = ? " +
                     "ORDER BY ordinal_position";
        return jdbcTemplate.queryForList(sql, tableName);
    }

    public Map<String, Object> getPrimaryKey(String tableName) {
        try {
            String sqlName = "SELECT conname FROM pg_constraint WHERE conrelid = ('user_data.\"' || ? || '\"')::regclass AND contype = 'p'";
            String constraintName = jdbcTemplate.queryForObject(sqlName, String.class, tableName);

            String sqlCols = "SELECT a.attname " +
                             "FROM pg_index i " +
                             "JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) " +
                             "WHERE i.indrelid = ('user_data.\"' || ? || '\"')::regclass AND i.indisprimary";
            List<String> cols = jdbcTemplate.queryForList(sqlCols, String.class, tableName);
            
            return Map.of("constraintName", constraintName, "columns", cols);
        } catch (Exception e) {
            return null; // No primary key
        }
    }

    public List<Map<String, Object>> getForeignKeys(String tableName) {
        String sql = "SELECT " +
                     "    tc.constraint_name as \"name\", " +
                     "    kcu.column_name as \"column\", " +
                     "    ccu.table_name AS \"referencedTable\", " +
                     "    ccu.column_name AS \"referencedColumn\" " +
                     "FROM " +
                     "    information_schema.table_constraints AS tc " +
                     "    JOIN information_schema.key_column_usage AS kcu " +
                     "      ON tc.constraint_name = kcu.constraint_name " +
                     "      AND tc.table_schema = kcu.table_schema " +
                     "    JOIN information_schema.constraint_column_usage AS ccu " +
                     "      ON ccu.constraint_name = tc.constraint_name " +
                     "      AND ccu.table_schema = tc.table_schema " +
                     "WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = ? AND tc.table_schema = 'user_data'";
        return jdbcTemplate.queryForList(sql, tableName);
    }

    public List<Map<String, Object>> getAllRelationships() {
        String sql = "SELECT " +
                     "    tc.table_name as \"sourceTable\", " +
                     "    kcu.column_name as \"sourceColumn\", " +
                     "    ccu.table_name AS \"targetTable\", " +
                     "    ccu.column_name AS \"targetColumn\", " +
                     "    tc.constraint_name as \"constraintName\" " +
                     "FROM " +
                     "    information_schema.table_constraints AS tc " +
                     "    JOIN information_schema.key_column_usage AS kcu " +
                     "      ON tc.constraint_name = kcu.constraint_name " +
                     "      AND tc.table_schema = kcu.table_schema " +
                     "    JOIN information_schema.constraint_column_usage AS ccu " +
                     "      ON ccu.constraint_name = tc.constraint_name " +
                     "      AND ccu.table_schema = tc.table_schema " +
                     "WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'user_data'";
        return jdbcTemplate.queryForList(sql);
    }
}
