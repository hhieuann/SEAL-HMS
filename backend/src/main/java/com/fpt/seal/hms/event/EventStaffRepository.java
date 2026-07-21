package com.fpt.seal.hms.event;

import com.fpt.seal.hms.event.entity.EventStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventStaffRepository extends JpaRepository<EventStaff, Long> {
    List<EventStaff> findByEvent_Id(Long eventId);
    List<EventStaff> findByAccount_Id(Long accountId);
    Optional<EventStaff> findByEvent_IdAndAccount_Id(Long eventId, Long accountId);
    boolean existsByEvent_IdAndAccount_Id(Long eventId, Long accountId);
}
