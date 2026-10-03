package com.database.backend.dto;

import java.util.List;

public class CreateTableRequest {
    private String tableName;
    private List<ColumnDefinition> columns;

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }
    public List<ColumnDefinition> getColumns() { return columns; }
    public void setColumns(List<ColumnDefinition> columns) { this.columns = columns; }
}
