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
           "LEFT JOIN track_assignment ta ON t.track_id = ta.track_id AND ta.assignment_role = 'JUDGE' " +
           "LEFT JOIN lecturer judge_lecturer ON ta.lecturer_id = judge_lecturer.lecturer_id " +
           "LEFT JOIN account judge_account ON judge_lecturer.account_id = judge_account.account_id " +
           "LEFT JOIN team mentored_team ON e.event_id = mentored_team.event_id " +
           "LEFT JOIN mentor m ON mentored_team.team_id = m.team_id " +
           "LEFT JOIN lecturer mentor_lecturer ON m.lecturer_id = mentor_lecturer.lecturer_id " +
           "LEFT JOIN account mentor_account ON mentor_lecturer.account_id = mentor_account.account_id " +
           "LEFT JOIN event_staff es ON e.event_id = es.event_id " +
           "LEFT JOIN account staff_account ON es.account_id = staff_account.account_id " +
           "WHERE judge_account.email = :email " +
           "OR mentor_account.email = :email " +
           "OR staff_account.email = :email", nativeQuery = true)
    List<Event> findEventsAssignedToExpertByEmail(@Param("email") String email);
}
