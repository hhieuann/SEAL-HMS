package com.fpt.seal.hms.staff;

import com.fpt.seal.hms.staff.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByAccount_Id(Long accountId);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
}
