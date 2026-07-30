package com.fpt.seal.hms.lecturer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LecturerRepository extends JpaRepository<Lecturer, Long> {
    Optional<Lecturer> findByAccount_Id(Long accountId);
    boolean existsByAccount_Id(Long accountId);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
}
