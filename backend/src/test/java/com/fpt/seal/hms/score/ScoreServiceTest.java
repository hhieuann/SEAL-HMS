package com.fpt.seal.hms.score;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.criterion.CriterionRepository;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.score.dto.GradeSubmissionRequest;
import com.fpt.seal.hms.score.dto.ScoreRequest;
import com.fpt.seal.hms.score.entity.Score;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.submission.entity.Submission;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoreServiceTest {

    @Mock
    private ScoreRepository scoreRepository;
    @Mock
    private SubmissionRepository submissionRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private CriterionRepository criterionRepository;
    @Mock
    private RoundRankingRepository roundRankingRepository;
    @Mock
    private com.fpt.seal.hms.team.TeamRepository teamRepository;
    @InjectMocks
    private ScoreService scoreService;

    private Account judge(long id) {
        Account a = new Account();
        a.setId(id);
        a.setEmail("judge" + id + "@fpt.edu.vn");
        return a;
    }

    private Criterion criterion(long id, String maxScore, String weight) {
        Criterion c = new Criterion();
        c.setId(id);
        c.setMaxScore(new BigDecimal(maxScore));
        c.setWeight(new BigDecimal(weight));
        return c;
    }

    private Submission submission(long id) {
        Submission s = new Submission();
        s.setId(id);
        s.setRoundRanking(new RoundRanking());
        return s;
    }

    private ScoreRequest scoreReq(long criterionId, String score) {
        ScoreRequest r = new ScoreRequest();
        r.setCriterionId(criterionId);
        r.setScore(new BigDecimal(score));
        return r;
    }

    private GradeSubmissionRequest gradeReq(long judgeId, ScoreRequest... scores) {
        GradeSubmissionRequest g = new GradeSubmissionRequest();
        g.setJudgeAccountId(judgeId);
        g.setScores(List.of(scores));
        return g;
    }

    private Score persisted(Submission sub, Account judge, Criterion crit, String value) {
        Score s = new Score();
        s.setSubmission(sub);
        s.setJudgeAccount(judge);
        s.setCriterion(crit);
        s.setScore(new BigDecimal(value));
        return s;
    }

    @Test
    void gradeSubmission_weightsAndNormalizesByMaxScore() {
        // criteria: max 10 / weight 0.6 and max 10 / weight 0.4 (weights sum to 1.0)
        Submission sub = submission(1L);
        Account j = judge(7L);
        Criterion c1 = criterion(1L, "10", "0.6"), c2 = criterion(2L, "10", "0.4");
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c1));
        when(criterionRepository.findById(2L)).thenReturn(Optional.of(c2));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong()))
                .thenReturn(Optional.empty());
        // recalc reads back the two saved scores: 8/10*0.6 + 5/10*0.4 = 0.68 -> x100 = 68.00
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(
                persisted(sub, j, c1, "8"), persisted(sub, j, c2, "5")));

        scoreService.gradeSubmission(1L, gradeReq(7L, scoreReq(1L, "8"), scoreReq(2L, "5")));

        ArgumentCaptor<RoundRanking> cap = ArgumentCaptor.forClass(RoundRanking.class);
        verify(roundRankingRepository).save(cap.capture());
        assertThat(cap.getValue().getScore()).isEqualByComparingTo("68.00");
    }

    @Test
    void gradeSubmission_averagesAcrossJudges() {
        Submission sub = submission(1L);
        Account j1 = judge(7L), j2 = judge(8L);
        Criterion c1 = criterion(1L, "10", "1.0");
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(8L)).thenReturn(Optional.of(j2));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c1));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong()))
                .thenReturn(Optional.empty());
        // judge1 already scored 10 (=100), judge2 scores 5 (=50) -> avg 75.00
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(
                persisted(sub, j1, c1, "10"), persisted(sub, j2, c1, "5")));

        scoreService.gradeSubmission(1L, gradeReq(8L, scoreReq(1L, "5")));

        ArgumentCaptor<RoundRanking> cap = ArgumentCaptor.forClass(RoundRanking.class);
        verify(roundRankingRepository).save(cap.capture());
        assertThat(cap.getValue().getScore()).isEqualByComparingTo("75.00");
    }

    @Test
    void gradeSubmission_clampsScoreToCriterionMax() {
        Submission sub = submission(1L);
        Account j = judge(7L);
        Criterion c1 = criterion(1L, "10", "1.0");
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c1));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong()))
                .thenReturn(Optional.empty());
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(persisted(sub, j, c1, "10")));

        scoreService.gradeSubmission(1L, gradeReq(7L, scoreReq(1L, "15"))); // 15 > max 10

        ArgumentCaptor<Score> cap = ArgumentCaptor.forClass(Score.class);
        verify(scoreRepository).save(cap.capture());
        assertThat(cap.getValue().getScore()).isEqualByComparingTo("10"); // clamped
    }

    @Test
    void gradeSubmission_upserts_existingScoreIsUpdatedNotDuplicated() {
        Submission sub = submission(1L);
        Account j = judge(7L);
        Criterion c1 = criterion(1L, "10", "1.0");
        Score existing = persisted(sub, j, c1, "4");
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c1));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(1L, 7L, 1L))
                .thenReturn(Optional.of(existing));
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(existing));

        scoreService.gradeSubmission(1L, gradeReq(7L, scoreReq(1L, "9")));

        ArgumentCaptor<Score> cap = ArgumentCaptor.forClass(Score.class);
        verify(scoreRepository).save(cap.capture());
        assertThat(cap.getValue()).isSameAs(existing); // same row updated
        assertThat(existing.getScore()).isEqualByComparingTo("9");
    }

    @Test
    void gradeSubmission_throws_whenSubmissionMissing() {
        when(submissionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scoreService.gradeSubmission(99L, gradeReq(7L, scoreReq(1L, "5"))))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(scoreRepository, never()).save(any());
    }

    @Test
    void gradeSubmission_throws_whenJudgeAccountMissing() {
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(submission(1L)));
        when(accountRepository.findById(7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scoreService.gradeSubmission(1L, gradeReq(7L, scoreReq(1L, "5"))))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
