package com.fpt.seal.hms.score;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.criterion.CriterionRepository;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.score.dto.GradeSubmissionRequest;
import com.fpt.seal.hms.score.dto.ScoreResponse;
import com.fpt.seal.hms.score.entity.Score;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.submission.entity.Submission;
import com.fpt.seal.hms.team.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final SubmissionRepository submissionRepository;
    private final AccountRepository accountRepository;
    private final CriterionRepository criterionRepository;
    private final RoundRankingRepository roundRankingRepository;
    private final TeamRepository teamRepository;

    @Transactional(readOnly = true)
    public List<ScoreResponse> getScoresForSubmission(Long submissionId) {
        return scoreRepository.findBySubmissionId(submissionId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ScoreResponse> getScoresByJudge(Long submissionId, Long judgeAccountId) {
        return scoreRepository.findBySubmissionIdAndJudgeAccountId(submissionId, judgeAccountId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public List<ScoreResponse> gradeSubmission(Long submissionId, GradeSubmissionRequest request) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        Account judge = accountRepository.findById(request.getJudgeAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Judge account not found"));

        // Upsert each score entry
        for (var scoreReq : request.getScores()) {
            Criterion criterion = criterionRepository.findById(scoreReq.getCriterionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Criterion not found: " + scoreReq.getCriterionId()));

            // Clamp score to max
            BigDecimal value = scoreReq.getScore();
            if (criterion.getMaxScore() != null && value.compareTo(criterion.getMaxScore()) > 0) {
                value = criterion.getMaxScore();
            }

            Optional<Score> existing = scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(
                    submissionId, judge.getId(), criterion.getId());

            Score score = existing.orElseGet(Score::new);
            score.setSubmission(submission);
            score.setJudgeAccount(judge);
            score.setCriterion(criterion);
            score.setScore(value);
            score.setComment(scoreReq.getComment());
            scoreRepository.save(score);
        }

        // Recalculate and update round_ranking total score for this team
        recalcRoundRankingScore(submission);

        return getScoresForSubmission(submissionId);
    }

    private void recalcRoundRankingScore(Submission submission) {
        RoundRanking rr = submission.getRoundRanking();
        List<Score> allScores = scoreRepository.findBySubmissionId(submission.getId());
        if (allScores.isEmpty()) return;

        BigDecimal weightedTotal = BigDecimal.ZERO;
        for (Score s : allScores) {
            BigDecimal scoreVal = s.getScore() != null ? s.getScore() : BigDecimal.ZERO;
            BigDecimal weight = s.getCriterion().getWeight() != null ? s.getCriterion().getWeight() : BigDecimal.ZERO;
            BigDecimal maxScore = s.getCriterion().getMaxScore();
            // Normalize the raw score to a 0..1 ratio against the criterion's own max,
            // then weight it. With weights summing to 100 across a round's criteria, a
            // judge's total lands on a 0..100 scale regardless of each criterion's max.
            BigDecimal ratio = (maxScore != null && maxScore.signum() > 0)
                    ? scoreVal.divide(maxScore, 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            BigDecimal weightedScore = ratio.multiply(weight);
            weightedTotal = weightedTotal.add(weightedScore);
        }

        long judgeCount = allScores.stream()
                .map(s -> s.getJudgeAccount().getId())
                .distinct().count();

        if (judgeCount > 0) {
            // Multiply by 100 because the criterion weights in the DB sum to 1.0
            BigDecimal avg = weightedTotal.multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(judgeCount), 2, RoundingMode.HALF_UP);
            rr.setScore(avg);
            roundRankingRepository.save(rr);
        }
    }

    private ScoreResponse mapToResponse(Score score) {
        ScoreResponse r = new ScoreResponse();
        r.setId(score.getId());
        r.setSubmissionId(score.getSubmission().getId());
        r.setJudgeAccountId(score.getJudgeAccount().getId());
        r.setJudgeEmail(score.getJudgeAccount().getEmail());
        r.setCriterionId(score.getCriterion().getId());
        r.setCriterionName(score.getCriterion().getName());
        r.setMaxScore(score.getCriterion().getMaxScore());
        r.setScore(score.getScore());
        r.setComment(score.getComment());
        return r;
    }
}
