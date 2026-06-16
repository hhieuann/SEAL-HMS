package com.fpt.seal.hms.round;

import com.fpt.seal.hms.round.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoundRepository extends JpaRepository<Round, Long> {

    List<Round> findByEventId(Long eventId);

    @Query("SELECT MAX(r.roundSeq) FROM Round r WHERE r.event.id = :eventId")
    Optional<Integer> findMaxRoundSeqByEventId(@Param("eventId") Long eventId);
}
