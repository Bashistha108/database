package com.database.backend.controller;

import java.util.Map;

public class UpdateDataRequest {
    private Map<String, Object> pkValues;
    private Map<String, Object> updateData;

    public Map<String, Object> getPkValues() { return pkValues; }
    public void setPkValues(Map<String, Object> pkValues) { this.pkValues = pkValues; }
    public Map<String, Object> getUpdateData() { return updateData; }
    public void setUpdateData(Map<String, Object> updateData) { this.updateData = updateData; }
}
