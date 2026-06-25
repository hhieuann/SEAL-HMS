package com.fpt.seal.hms.prize;

import com.fpt.seal.hms.prize.entity.Prize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrizeRepository extends JpaRepository<Prize, Long> {
    List<Prize> findByEventIdOrderByRankAsc(Long eventId);
}
