package com.fpt.seal.hms.lecturer.dto;

import com.fpt.seal.hms.lecturer.Lecturer;

public record LecturerResponse(
        Long id, Long accountId, String email,
        String fullName, String department, String campus, String phone) {

    public static LecturerResponse from(Lecturer l) {
        return new LecturerResponse(
                l.getId(),
                l.getAccount().getId(),
                l.getAccount().getEmail(),
                l.getFullName(),
                l.getDepartment(),
                l.getCampus(),
                l.getPhone());
    }
}
