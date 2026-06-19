package com.fpt.seal.hms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class SealHmsApplication {
    public static void main(String[] args) {
        // Force a valid IANA zone before any DB connection. Some Windows installs report
        // the JVM default as the deprecated alias "Asia/Saigon", which PostgreSQL 18
        // rejects on connect ("invalid value for parameter TimeZone").
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(SealHmsApplication.class, args);
    }
}
