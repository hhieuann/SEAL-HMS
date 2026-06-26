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
           "JOIN track t ON e.event_id = t.event_id " +
           "JOIN track_assignment ta ON t.track_id = ta.track_id " +
           "JOIN lecturer l ON ta.lecturer_id = l.lecturer_id " +
           "JOIN account a ON l.account_id = a.account_id " +
           "WHERE a.email = :email", nativeQuery = true)
    List<Event> findEventsAssignedToJudgeByEmail(@Param("email") String email);
}
