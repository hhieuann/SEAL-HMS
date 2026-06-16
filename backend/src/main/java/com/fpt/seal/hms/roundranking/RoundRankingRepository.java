package com.fpt.seal.hms.roundranking;

import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoundRankingRepository extends JpaRepository<RoundRanking, Long> {
    Optional<RoundRanking> findByRoundIdAndTeamId(Long roundId, Long teamId);
}
