package com.fpt.seal.hms.event;

import com.fpt.seal.hms.event.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Query(value = "SELECT DISTINCT e.* FROM event e " +
           "JOIN round r ON e.event_id = r.event_id " +
           "JOIN judge j ON r.round_id = j.round_id " +
           "JOIN lecturer l ON j.lecturer_id = l.lecturer_id " +
           "JOIN account a ON l.account_id = a.account_id " +
           "WHERE a.email = :email", nativeQuery = true)
    List<Event> findEventsAssignedToJudgeByEmail(@Param("email") String email);
}
