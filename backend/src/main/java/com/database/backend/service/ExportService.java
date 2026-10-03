package com.database.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.OutputStreamWriter;
import java.io.Writer;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ExportService {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern DANGEROUS_SQL = Pattern.compile(
        "(?i)\\b(DROP\\s+DATABASE|DROP\\s+SCHEMA|GRANT|REVOKE|ALTER\\s+SYSTEM|ALTER\\s+USER|ALTER\\s+ROLE)\\b"
    );

    public ExportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void exportData(String type, String source, String format, java.io.OutputStream out) {
        String sql;
        if ("TABLE".equalsIgnoreCase(type)) {
            if (!source.matches("^[a-zA-Z0-9_]+$")) {
                throw new IllegalArgumentException("Invalid table name");
            }
            sql = "SELECT * FROM " + source;
        } else {
            sql = source;
        }

        if (DANGEROUS_SQL.matcher(sql).find()) {
            throw new IllegalArgumentException("Dangerous SQL commands are blocked.");
        }

        jdbcTemplate.execute((java.sql.Connection con) -> {
            try (Statement stmt = con.createStatement()) {
                stmt.execute("SET search_path TO user_data, public");
                stmt.setFetchSize(1000); // efficient streaming
                try (ResultSet rs = stmt.executeQuery(sql)) {
                    if ("csv".equalsIgnoreCase(format)) {
                        exportToCsv(rs, out);
                    } else if ("xlsx".equalsIgnoreCase(format)) {
                        exportToXlsx(rs, out);
                    } else if ("json".equalsIgnoreCase(format)) {
                        exportToJson(rs, out);
                    }
                }
            } catch (Exception e) {
                throw new RuntimeException("Export failed", e);
            }
            return null;
        });
    }

    private void exportToCsv(ResultSet rs, java.io.OutputStream out) throws Exception {
        Writer writer = new OutputStreamWriter(out);
        CSVFormat format = CSVFormat.DEFAULT;
        try (CSVPrinter printer = new CSVPrinter(writer, format)) {
            ResultSetMetaData rsmd = rs.getMetaData();
            int columnCount = rsmd.getColumnCount();
            for (int i = 1; i <= columnCount; i++) {
                printer.print(rsmd.getColumnLabel(i));
            }
            printer.println();

            while (rs.next()) {
                for (int i = 1; i <= columnCount; i++) {
                    Object val = rs.getObject(i);
                    if (val instanceof byte[]) {
                        printer.print("[BINARY DATA]");
                    } else {
                        printer.print(val);
                    }
                }
                printer.println();
            }
        }
    }

    private void exportToXlsx(ResultSet rs, java.io.OutputStream out) throws Exception {
        SXSSFWorkbook wb = new SXSSFWorkbook(100);
        try {
            Sheet sheet = wb.createSheet("Export");
            ResultSetMetaData rsmd = rs.getMetaData();
            int columnCount = rsmd.getColumnCount();
            Row headerRow = sheet.createRow(0);
            for (int i = 1; i <= columnCount; i++) {
                headerRow.createCell(i - 1).setCellValue(rsmd.getColumnLabel(i));
            }

            int rowNum = 1;
            while (rs.next()) {
                Row row = sheet.createRow(rowNum++);
                for (int i = 1; i <= columnCount; i++) {
                    Object val = rs.getObject(i);
                    Cell cell = row.createCell(i - 1);
                    if (val == null) {
                        cell.setBlank();
                    } else if (val instanceof Number) {
                        cell.setCellValue(((Number) val).doubleValue());
                    } else if (val instanceof Boolean) {
                        cell.setCellValue((Boolean) val);
                    } else if (val instanceof byte[]) {
                        cell.setCellValue("[BINARY DATA]");
                    } else {
                        cell.setCellValue(val.toString());
                    }
                }
            }
            wb.write(out);
        } finally {
            wb.dispose(); // delete temp files
            wb.close();
        }
    }

    private void exportToJson(ResultSet rs, java.io.OutputStream out) throws Exception {
        ResultSetMetaData rsmd = rs.getMetaData();
        int columnCount = rsmd.getColumnCount();
        String[] columns = new String[columnCount];
        for (int i = 1; i <= columnCount; i++) {
            columns[i - 1] = rsmd.getColumnLabel(i);
        }

        out.write("[\n".getBytes());
        boolean first = true;
        while (rs.next()) {
            if (!first) {
                out.write(",\n".getBytes());
            }
            first = false;
            Map<String, Object> row = new HashMap<>();
            for (int i = 1; i <= columnCount; i++) {
                Object val = rs.getObject(i);
                if (val instanceof byte[]) {
                    row.put(columns[i - 1], "[BINARY DATA]");
                } else {
                    row.put(columns[i - 1], val);
                }
            }
            out.write(objectMapper.writeValueAsBytes(row));
        }
        out.write("\n]".getBytes());
    }
}
