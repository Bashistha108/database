package com.database.backend.controller;

public class ExportRequest {
    private String type;
    private String source;
    private String format;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
}
