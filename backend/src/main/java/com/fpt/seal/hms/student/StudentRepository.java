package com.fpt.seal.hms.student;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByAccount_Id(Long accountId);
    boolean existsByAccount_Id(Long accountId);
    boolean existsByStudentCode(String studentCode);
}
