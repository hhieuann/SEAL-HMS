package com.fpt.seal.hms.criterion;

import com.fpt.seal.hms.criterion.entity.Criterion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CriterionRepository extends JpaRepository<Criterion, Long> {

    List<Criterion> findByRoundId(Long roundId);

    @Query("SELECT SUM(c.weight) FROM Criterion c WHERE c.round.id = :roundId")
    Optional<BigDecimal> sumWeightByRoundId(@Param("roundId") Long roundId);
}
