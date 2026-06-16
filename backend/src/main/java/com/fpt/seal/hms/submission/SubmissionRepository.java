package com.fpt.seal.hms.submission;

import com.fpt.seal.hms.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Optional<Submission> findByRoundRankingId(Long roundRankingId);
}
