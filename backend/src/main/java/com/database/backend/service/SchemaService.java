package com.database.backend.service;

import com.database.backend.dto.ColumnDefinition;
import com.database.backend.dto.CreateTableRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SchemaService {

    private final JdbcTemplate jdbcTemplate;

    public SchemaService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private String quote(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }

    public void createTable(CreateTableRequest request) {
        StringBuilder sql = new StringBuilder("CREATE TABLE user_data.");
        sql.append(quote(request.getTableName())).append(" (");

        List<ColumnDefinition> cols = request.getColumns();
        for (int i = 0; i < cols.size(); i++) {
            ColumnDefinition col = cols.get(i);
            sql.append(quote(col.getName())).append(" ").append(col.getType());
            if (!col.isNullable()) {
                sql.append(" NOT NULL");
            }
            if (col.getDefaultValue() != null && !col.getDefaultValue().trim().isEmpty()) {
                sql.append(" DEFAULT ").append(col.getDefaultValue().trim());
            }
            if (col.isPrimaryKey()) {
                sql.append(" PRIMARY KEY");
            }
            if (i < cols.size() - 1) {
                sql.append(", ");
            }
        }
        sql.append(");");

        jdbcTemplate.execute(sql.toString());
    }

    public void renameTable(String oldName, String newName) {
        String sql = "ALTER TABLE user_data." + quote(oldName) + " RENAME TO " + quote(newName);
        jdbcTemplate.execute(sql);
    }

    public void dropTable(String tableName) {
        String sql = "DROP TABLE user_data." + quote(tableName) + " CASCADE";
        jdbcTemplate.execute(sql);
    }

    public void addColumn(String tableName, ColumnDefinition col) {
        StringBuilder sql = new StringBuilder("ALTER TABLE user_data.");
        sql.append(quote(tableName)).append(" ADD COLUMN ");
        sql.append(quote(col.getName())).append(" ").append(col.getType());
        
        if (!col.isNullable()) {
            sql.append(" NOT NULL");
        }
        if (col.getDefaultValue() != null && !col.getDefaultValue().trim().isEmpty()) {
            sql.append(" DEFAULT ").append(col.getDefaultValue().trim());
        }
        jdbcTemplate.execute(sql.toString());
    }

    public void renameColumn(String tableName, String oldColName, String newColName) {
        String sql = "ALTER TABLE user_data." + quote(tableName) + 
                     " RENAME COLUMN " + quote(oldColName) + " TO " + quote(newColName);
        jdbcTemplate.execute(sql);
    }

    public void dropColumn(String tableName, String columnName) {
        String sql = "ALTER TABLE user_data." + quote(tableName) + 
                     " DROP COLUMN " + quote(columnName);
        jdbcTemplate.execute(sql);
    }

    public void alterColumnProperties(String tableName, String columnName, ColumnDefinition newDef) {
        // Drop or Set Default
        if (newDef.getDefaultValue() == null || newDef.getDefaultValue().trim().isEmpty()) {
            jdbcTemplate.execute("ALTER TABLE user_data." + quote(tableName) + " ALTER COLUMN " + quote(columnName) + " DROP DEFAULT");
        } else {
            jdbcTemplate.execute("ALTER TABLE user_data." + quote(tableName) + " ALTER COLUMN " + quote(columnName) + " SET DEFAULT " + newDef.getDefaultValue().trim());
        }

        // Drop or Set NOT NULL
        if (newDef.isNullable()) {
            jdbcTemplate.execute("ALTER TABLE user_data." + quote(tableName) + " ALTER COLUMN " + quote(columnName) + " DROP NOT NULL");
        } else {
            jdbcTemplate.execute("ALTER TABLE user_data." + quote(tableName) + " ALTER COLUMN " + quote(columnName) + " SET NOT NULL");
        }
    }

    public void addPrimaryKey(String tableName, List<String> columns) {
        String cols = columns.stream().map(this::quote).reduce((a,b)->a+","+b).orElse("");
        jdbcTemplate.execute("ALTER TABLE user_data." + quote(tableName) + " ADD PRIMARY KEY (" + cols + ")");
    }

    public void dropPrimaryKey(String tableName, String constraintName) {
        jdbcTemplate.execute("ALTER TABLE user_data." + quote(tableName) + " DROP CONSTRAINT " + quote(constraintName));
    }

    public void addForeignKey(String tableName, com.database.backend.dto.ForeignKeyRequest request) {
        String constraintName = request.getName() != null && !request.getName().trim().isEmpty() 
            ? request.getName() 
            : "fk_" + tableName + "_" + String.join("_", request.getColumns());
        
        String cols = request.getColumns().stream().map(this::quote).reduce((a,b)->a+","+b).orElse("");
        String refCols = request.getReferencedColumns().stream().map(this::quote).reduce((a,b)->a+","+b).orElse("");
        
        StringBuilder sql = new StringBuilder("ALTER TABLE user_data." + quote(tableName));
        sql.append(" ADD CONSTRAINT ").append(quote(constraintName));
        sql.append(" FOREIGN KEY (").append(cols).append(") REFERENCES user_data.").append(quote(request.getReferencedTable())).append("(").append(refCols).append(")");
        
        if (request.getOnDelete() != null && !request.getOnDelete().trim().isEmpty()) {
            sql.append(" ON DELETE ").append(request.getOnDelete());
        }
        if (request.getOnUpdate() != null && !request.getOnUpdate().trim().isEmpty()) {
            sql.append(" ON UPDATE ").append(request.getOnUpdate());
        }
        
        jdbcTemplate.execute(sql.toString());
    }

    public void dropForeignKey(String tableName, String constraintName) {
        jdbcTemplate.execute("ALTER TABLE user_data." + quote(tableName) + " DROP CONSTRAINT " + quote(constraintName));
    }
}
