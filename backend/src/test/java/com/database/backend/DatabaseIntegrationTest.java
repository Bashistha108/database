package com.database.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class DatabaseIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("testdb")
        .withUsername("postgres")
        .withPassword("password");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void testContainerStartupAndConnection() {
        assertTrue(postgres.isRunning());
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertEquals(1, result);
    }

    @Test
    void testUserDataSchemaExists() {
        // Liquibase should have created it
        Integer count = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM information_schema.schemata WHERE schema_name = 'user_data'", Integer.class);
        assertEquals(1, count);
    }

    @Test
    void testTableCreationAndCRUD() {
        // Create table
        jdbcTemplate.execute("CREATE TABLE user_data.integration_test_table (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL)");

        // Insert
        jdbcTemplate.update("INSERT INTO user_data.integration_test_table (name) VALUES (?)", "Test Name");

        // Select
        Map<String, Object> row = jdbcTemplate.queryForMap("SELECT * FROM user_data.integration_test_table WHERE name = ?", "Test Name");
        assertEquals("Test Name", row.get("name"));
        assertNotNull(row.get("id"));

        // Update
        jdbcTemplate.update("UPDATE user_data.integration_test_table SET name = ? WHERE id = ?", "Updated Name", row.get("id"));
        String updatedName = jdbcTemplate.queryForObject("SELECT name FROM user_data.integration_test_table WHERE id = ?", String.class, row.get("id"));
        assertEquals("Updated Name", updatedName);

        // Delete
        int deleted = jdbcTemplate.update("DELETE FROM user_data.integration_test_table WHERE id = ?", row.get("id"));
        assertEquals(1, deleted);

        // Drop table
        jdbcTemplate.execute("DROP TABLE user_data.integration_test_table");
    }
}
