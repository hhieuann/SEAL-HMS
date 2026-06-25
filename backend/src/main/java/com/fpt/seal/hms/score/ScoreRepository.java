package com.fpt.seal.hms.score;

import com.fpt.seal.hms.score.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    List<Score> findBySubmissionId(Long submissionId);
    Optional<Score> findBySubmissionIdAndJudgeAccountIdAndCriterionId(Long submissionId, Long judgeAccountId, Long criterionId);
    List<Score> findBySubmissionIdAndJudgeAccountId(Long submissionId, Long judgeAccountId);
}
