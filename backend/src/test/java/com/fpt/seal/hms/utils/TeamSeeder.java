package com.fpt.seal.hms.utils;

import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class TeamSeeder {

    private static class Student {
        Long accountId;
        String email;
        String token;
    }

    public static void main(String[] args) {
        long eventId = 1;
        int maxStudents = 21;

        if (args.length > 0) {
            try {
                eventId = Long.parseLong(args[0]);
            } catch (NumberFormatException e) {
                System.out.println("Invalid eventId provided. Using default 1.");
            }
        }
        if (args.length > 1) {
            try {
                maxStudents = Integer.parseInt(args[1]);
            } catch (NumberFormatException e) {
                System.out.println("Invalid maxStudents provided. Using default 21.");
            }
        }

        System.out.println("=== Starting Team Seeder for Event ID: " + eventId + " (Students: " + maxStudents + ") ===");
        
        String dbUrl = "jdbc:postgresql://localhost:5432/seal_hms?options=-c%20TimeZone=UTC";
        List<Student> students = new ArrayList<>();

        try (Connection conn = DriverManager.getConnection(dbUrl, "postgres", "12345");
             Statement stmt = conn.createStatement()) {
             
            System.out.println("Cleaning up existing teams in this event...");
            stmt.executeUpdate("DELETE FROM team_member WHERE team_id IN (SELECT team_id FROM team WHERE event_id = " + eventId + ")");
            stmt.executeUpdate("DELETE FROM team WHERE event_id = " + eventId);

            System.out.println("Fetching " + maxStudents + " students from database and resetting passwords to '123456'...");
            String hash = "$2a$10$3qATgVonL2P1oXTUG7r2KuBJY/FFOfCfdq1etYX6p3mkpQxHhg/92";
            stmt.executeUpdate("UPDATE account SET password = '" + hash + "' WHERE account_id IN (SELECT account_id FROM account WHERE role = 'STUDENT' AND status = 'ACTIVE' LIMIT " + maxStudents + ")");

            ResultSet rs = stmt.executeQuery("SELECT account_id, email FROM account WHERE role = 'STUDENT' AND status = 'ACTIVE' LIMIT " + maxStudents);
            while (rs.next()) {
                Student s = new Student();
                s.accountId = rs.getLong("account_id");
                s.email = rs.getString("email");
                students.add(s);
            }
            
            if (students.size() < 3) {
                System.out.println("Error: Not enough students found in DB to form at least 1 team. Found: " + students.size());
                return;
            }

            RestTemplate restTemplate = new RestTemplate();
            String baseUrl = "http://localhost:8080/api/v1";
            
            System.out.println("Logging in via API...");
            for (Student s : students) {
                Map<String, String> loginReq = Map.of("email", s.email, "password", "123456");
                ResponseEntity<Map> res = restTemplate.postForEntity(baseUrl + "/auth/login", loginReq, Map.class);
                Map<String, Object> body = (Map<String, Object>) res.getBody().get("data");
                s.token = (String) body.get("token");
            }

            int teamCounter = 1;
            for (int i = 0; i <= students.size() - 3; i += 3) {
                Student leader = students.get(i);
                Student mem1 = students.get(i + 1);
                Student mem2 = students.get(i + 2);

                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(leader.token);
                headers.setContentType(MediaType.APPLICATION_JSON);
                
                Map<String, Object> teamReq = Map.of(
                        "name", "Team " + teamCounter + " (Seeded)",
                        "leaderAccountId", leader.accountId
                );
                HttpEntity<Map> reqEntity = new HttpEntity<>(teamReq, headers);
                
                ResponseEntity<Map> teamRes = restTemplate.postForEntity(baseUrl + "/events/" + eventId + "/teams", reqEntity, Map.class);
                Map<String, Object> teamData = (Map<String, Object>) teamRes.getBody().get("data");
                Integer teamId = (Integer) teamData.get("id");

                Map<String, Object> invReq1 = Map.of("accountId", mem1.accountId, "role", "MEMBER");
                restTemplate.postForEntity(baseUrl + "/teams/" + teamId + "/members", new HttpEntity<>(invReq1, headers), Map.class);
                
                Map<String, Object> invReq2 = Map.of("accountId", mem2.accountId, "role", "MEMBER");
                restTemplate.postForEntity(baseUrl + "/teams/" + teamId + "/members", new HttpEntity<>(invReq2, headers), Map.class);

                // Auto-accept members in database
                stmt.executeUpdate("UPDATE team_member SET status = 'ACCEPTED' WHERE team_id = " + teamId + " AND account_id = " + mem1.accountId);
                stmt.executeUpdate("UPDATE team_member SET status = 'ACCEPTED' WHERE team_id = " + teamId + " AND account_id = " + mem2.accountId);
                        
                System.out.println("Created Team " + teamCounter + " (ID: " + teamId + ") -> Leader: " + leader.email + " | Members: " + mem1.email + ", " + mem2.email);
                teamCounter++;
            }
            
            System.out.println("=== Team Seeding Completed Successfully! ===");
            
        } catch (Exception e) {
            System.err.println("Error during seeding: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
