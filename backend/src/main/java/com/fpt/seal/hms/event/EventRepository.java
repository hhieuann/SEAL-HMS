package com.fpt.seal.hms.event;

import com.fpt.seal.hms.event.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    /** All events, newest first (explicit ordering — findAll() guarantees no order). */
    List<Event> findAllByOrderByCreatedAtDescIdDesc();

    @Query(value = "SELECT DISTINCT e.* FROM event e " +
           "LEFT JOIN track t ON e.event_id = t.event_id " +
           "LEFT JOIN track_assignment ta ON t.track_id = ta.track_id " +
           "LEFT JOIN lecturer l ON ta.lecturer_id = l.lecturer_id " +
           "LEFT JOIN event_staff es ON e.event_id = es.event_id " +
           "LEFT JOIN account a1 ON l.account_id = a1.account_id " +
           "LEFT JOIN account a2 ON es.account_id = a2.account_id " +
           "WHERE a1.email = :email OR a2.email = :email", nativeQuery = true)
    List<Event> findEventsAssignedToJudgeByEmail(@Param("email") String email);
}
