package com.database.backend.dto;

import java.util.List;

public class ForeignKeyRequest {
    private String name;
    private List<String> columns;
    private String referencedTable;
    private List<String> referencedColumns;
    private String onDelete;
    private String onUpdate;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<String> getColumns() { return columns; }
    public void setColumns(List<String> columns) { this.columns = columns; }
    public String getReferencedTable() { return referencedTable; }
    public void setReferencedTable(String referencedTable) { this.referencedTable = referencedTable; }
    public List<String> getReferencedColumns() { return referencedColumns; }
    public void setReferencedColumns(List<String> referencedColumns) { this.referencedColumns = referencedColumns; }
    public String getOnDelete() { return onDelete; }
    public void setOnDelete(String onDelete) { this.onDelete = onDelete; }
    public String getOnUpdate() { return onUpdate; }
    public void setOnUpdate(String onUpdate) { this.onUpdate = onUpdate; }
}
