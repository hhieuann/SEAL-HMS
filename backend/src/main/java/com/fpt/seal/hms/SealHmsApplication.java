package com.fpt.seal.hms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class SealHmsApplication {
    public static void main(String[] args) {
        // Must run before any DB connection. The PostgreSQL JDBC driver sends the JVM
        // default timezone in the connection startup packet; some Windows installs report
        // it as the deprecated alias "Asia/Saigon", which PostgreSQL 18 rejects outright
        // (before it ever reads the URL's ?options=TimeZone). Forcing a valid IANA zone
        // here is the only fix that works at that stage.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SpringApplication.run(SealHmsApplication.class, args);
    }
}
