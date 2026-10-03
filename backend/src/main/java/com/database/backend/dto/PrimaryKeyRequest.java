package com.database.backend.dto;

import java.util.List;

public class PrimaryKeyRequest {
    private List<String> columns;

    public List<String> getColumns() { return columns; }
    public void setColumns(List<String> columns) { this.columns = columns; }
}
