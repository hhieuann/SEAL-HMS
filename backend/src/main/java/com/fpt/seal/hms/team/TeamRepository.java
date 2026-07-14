package com.fpt.seal.hms.team;

import com.fpt.seal.hms.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByEventId(Long eventId);
    long countByEventId(Long eventId);
    boolean existsByTrack_IdAndMentor_Id(Long trackId, Long mentorId);
}
