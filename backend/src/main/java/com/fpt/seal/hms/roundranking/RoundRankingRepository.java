package com.fpt.seal.hms.roundranking;

import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoundRankingRepository extends JpaRepository<RoundRanking, Long> {
    Optional<RoundRanking> findByRoundIdAndTeamId(Long roundId, Long teamId);

    List<RoundRanking> findByRoundId(Long roundId);

    // All rankings across every round of an event (for event-level aggregation).
    List<RoundRanking> findByRound_Event_Id(Long eventId);
}
