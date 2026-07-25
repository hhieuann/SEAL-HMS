package com.fpt.seal.hms.team;

import com.fpt.seal.hms.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByEventId(Long eventId);
    long countByEventId(Long eventId);
    long countByTrackId(Long trackId);
    /** Teams that opted into a chapter — used to build the year-long Chapter Leaderboard. */
    List<Team> findByChapterIsNotNull();
    boolean existsByTrack_IdAndMentor_Id(Long trackId, Long mentorId);
    List<Team> findByMentor_Account_Email(String email);
    boolean existsByMentor_Account_Email(String email);
    boolean existsByEvent_IdAndMentor_Account_Email(Long eventId, String email);
    Optional<Team> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
}
