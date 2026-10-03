package com.database.backend.controller;

public class QueryRequest {
    private String sql;
    private int limit = 1000;

    public String getSql() { return sql; }
    public void setSql(String sql) { this.sql = sql; }
    public int getLimit() { return limit; }
    public void setLimit(int limit) { this.limit = limit; }
}
