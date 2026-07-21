package com.fpt.seal.hms.score;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.criterion.CriterionRepository;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.score.dto.GradeSubmissionRequest;
import com.fpt.seal.hms.score.dto.ScoreRequest;
import com.fpt.seal.hms.score.dto.ScoreResponse;
import com.fpt.seal.hms.score.entity.Score;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.submission.entity.Submission;
import com.fpt.seal.hms.team.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/** Branch-targeting tests for ScoreService: deadline enforcement on ACTIVE rounds,
 *  penalty subtraction, null-maxScore ratio, and judge-name resolution both ways. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ScoreServiceMoreTest {

    @Mock private ScoreRepository scoreRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private CriterionRepository criterionRepository;
    @Mock private RoundRankingRepository roundRankingRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private LecturerRepository lecturerRepository;
    @InjectMocks private ScoreService scoreService;

    private Submission submission(long id, Round round, RoundRanking rr) {
        Submission s = new Submission();
        s.setId(id);
        rr.setRound(round);
        s.setRoundRanking(rr);
        return s;
    }

    private Round round(RoundStatus status, LocalDateTime start, Double hours) {
        Round r = new Round();
        r.setStatus(status);
        r.setStartTime(start);
        r.setDurationHours(hours);
        return r;
    }

    private Criterion criterion(long id, String max, String weight) {
        Criterion c = new Criterion();
        c.setId(id);
        c.setMaxScore(max == null ? null : new BigDecimal(max));
        c.setWeight(new BigDecimal(weight));
        return c;
    }

    private Account judge(long id) {
        Account a = new Account();
        a.setId(id);
        a.setEmail("judge" + id + "@fpt.edu.vn");
        return a;
    }

    private GradeSubmissionRequest gradeReq(long judgeId, long critId, String score) {
        ScoreRequest sr = new ScoreRequest();
        sr.setCriterionId(critId);
        sr.setScore(new BigDecimal(score));
        GradeSubmissionRequest g = new GradeSubmissionRequest();
        g.setJudgeAccountId(judgeId);
        g.setScores(List.of(sr));
        return g;
    }

    private Score persisted(Submission sub, Account j, Criterion c, String v) {
        Score s = new Score();
        s.setSubmission(sub);
        s.setJudgeAccount(j);
        s.setCriterion(c);
        s.setScore(new BigDecimal(v));
        return s;
    }

    // ---------- ACTIVE-round deadline branch ----------

    @Test
    void grade_rejected_whenActiveRoundDeadlineNotPassed() {
        Round round = round(RoundStatus.ACTIVE, LocalDateTime.now().minusHours(1), 24.0); // 23h left
        Submission sub = submission(1L, round, new RoundRanking());
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));

        assertThatThrownBy(() -> scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "8")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deadline has not passed");
    }

    @Test
    void grade_rejected_whenActiveRoundTimingNotConfigured() {
        Round round = round(RoundStatus.ACTIVE, null, null);
        Submission sub = submission(1L, round, new RoundRanking());
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));

        assertThatThrownBy(() -> scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "8")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not configured");
    }

    @Test
    void grade_allowed_whenActiveRoundDeadlinePassed() {
        Round round = round(RoundStatus.ACTIVE, LocalDateTime.now().minusHours(30), 24.0); // over
        Account j = judge(7L);
        Criterion c = criterion(1L, "10", "1.0");
        Submission sub = submission(1L, round, new RoundRanking());
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong())).thenReturn(Optional.empty());
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(persisted(sub, j, c, "8")));

        scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "8"));

        verify(scoreRepository).save(any(Score.class));
    }

    @Test
    void grade_throws_whenCriterionMissing() {
        Round round = round(RoundStatus.COMPLETED, null, null);
        Submission sub = submission(1L, round, new RoundRanking());
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(judge(7L)));
        when(criterionRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "8")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- recalc branches ----------

    @Test
    void recalc_nullMaxScore_contributesZero() {
        Round round = round(RoundStatus.COMPLETED, null, null);
        Account j = judge(7L);
        Criterion c = criterion(1L, null, "1.0"); // maxScore null -> ratio 0
        RoundRanking rr = new RoundRanking();
        Submission sub = submission(1L, round, rr);
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong())).thenReturn(Optional.empty());
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(persisted(sub, j, c, "8")));

        scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "8"));

        ArgumentCaptor<RoundRanking> cap = ArgumentCaptor.forClass(RoundRanking.class);
        verify(roundRankingRepository).save(cap.capture());
        assertThat(cap.getValue().getScore()).isEqualByComparingTo("0.00");
    }

    @Test
    void recalc_subtractsPenaltyPoints_whenPresent() {
        Round round = round(RoundStatus.COMPLETED, null, null);
        Account j = judge(7L);
        Criterion c = criterion(1L, "10", "1.0");
        RoundRanking rr = new RoundRanking();
        rr.setPenaltyPoints(new BigDecimal("20")); // penalty branch
        Submission sub = submission(1L, round, rr);
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong())).thenReturn(Optional.empty());
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(persisted(sub, j, c, "10")));

        scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "10"));

        ArgumentCaptor<RoundRanking> cap = ArgumentCaptor.forClass(RoundRanking.class);
        verify(roundRankingRepository).save(cap.capture());
        assertThat(cap.getValue().getScore()).isEqualByComparingTo("80.00"); // 100 - 20
    }

    // ---------- mapToResponse judge-name branches ----------

    @Test
    void getScores_usesLecturerFullName_whenLecturerProfileExists() {
        Score s = new Score();
        s.setId(1L);
        Submission sub = new Submission();
        sub.setId(1L);
        s.setSubmission(sub);
        Account j = judge(7L);
        s.setJudgeAccount(j);
        Criterion c = criterion(1L, "10", "1.0");
        c.setName("Tech");
        s.setCriterion(c);
        s.setScore(new BigDecimal("8"));
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(s));
        Lecturer lect = new Lecturer();
        lect.setFullName("Judge J");
        when(lecturerRepository.findByAccount_Id(7L)).thenReturn(Optional.of(lect));

        List<ScoreResponse> out = scoreService.getScoresForSubmission(1L);

        assertThat(out.get(0).getJudgeName()).isEqualTo("Judge J");
    }

    @Test
    void getScores_fallsBackToEmail_whenNoLecturerProfile() {
        Score s = new Score();
        s.setId(1L);
        Submission sub = new Submission();
        sub.setId(1L);
        s.setSubmission(sub);
        Account j = judge(7L);
        s.setJudgeAccount(j);
        Criterion c = criterion(1L, "10", "1.0");
        s.setCriterion(c);
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(s));
        when(lecturerRepository.findByAccount_Id(7L)).thenReturn(Optional.empty());

        List<ScoreResponse> out = scoreService.getScoresForSubmission(1L);

        assertThat(out.get(0).getJudgeName()).isEqualTo("judge7@fpt.edu.vn");
    }

    @Test
    void getScoresByJudge_delegatesToRepository() {
        when(scoreRepository.findBySubmissionIdAndJudgeAccountId(1L, 7L)).thenReturn(List.of());

        assertThat(scoreService.getScoresByJudge(1L, 7L)).isEmpty();
        verify(scoreRepository).findBySubmissionIdAndJudgeAccountId(1L, 7L);
    }

    @Test
    void recalc_earlyReturn_whenNoScoresExist() {
        Round round = round(RoundStatus.COMPLETED, null, null);
        Account j = judge(7L);
        Criterion c = criterion(1L, "10", "1.0");
        RoundRanking rr = new RoundRanking();
        Submission sub = submission(1L, round, rr);
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong())).thenReturn(Optional.empty());
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of()); // no scores back -> early return

        scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "8"));

        verify(roundRankingRepository, never()).save(any()); // nothing to recalc
    }

    @Test
    void recalc_nullScoreValue_countsAsZero() {
        Round round = round(RoundStatus.COMPLETED, null, null);
        Account j = judge(7L);
        Criterion c = criterion(1L, "10", "1.0");
        RoundRanking rr = new RoundRanking();
        Submission sub = submission(1L, round, rr);
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong())).thenReturn(Optional.empty());
        Score nullScore = persisted(sub, j, c, "0");
        nullScore.setScore(null); // score null -> ZERO branch in recalc
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(nullScore));

        scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "8"));

        ArgumentCaptor<RoundRanking> cap = ArgumentCaptor.forClass(RoundRanking.class);
        verify(roundRankingRepository).save(cap.capture());
        assertThat(cap.getValue().getScore()).isEqualByComparingTo("0.00");
    }

    @Test
    void recalc_nullWeight_countsAsZero() {
        Round round = round(RoundStatus.COMPLETED, null, null);
        Account j = judge(7L);
        Criterion c = new Criterion();
        c.setId(1L);
        c.setMaxScore(new BigDecimal("10"));
        c.setWeight(null); // weight null -> ZERO branch
        RoundRanking rr = new RoundRanking();
        Submission sub = submission(1L, round, rr);
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong())).thenReturn(Optional.empty());
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(persisted(sub, j, c, "8")));

        scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "8"));

        ArgumentCaptor<RoundRanking> cap = ArgumentCaptor.forClass(RoundRanking.class);
        verify(roundRankingRepository).save(cap.capture());
        assertThat(cap.getValue().getScore()).isEqualByComparingTo("0.00");
    }

    @Test
    void grade_scoreNotClamped_whenMaxScoreNull() {
        // criterion maxScore null -> the clamp branch (value > max) is skipped
        Round round = round(RoundStatus.COMPLETED, null, null);
        Account j = judge(7L);
        Criterion c = criterion(1L, null, "1.0");
        RoundRanking rr = new RoundRanking();
        Submission sub = submission(1L, round, rr);
        when(submissionRepository.findById(1L)).thenReturn(Optional.of(sub));
        when(accountRepository.findById(7L)).thenReturn(Optional.of(j));
        when(criterionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(scoreRepository.findBySubmissionIdAndJudgeAccountIdAndCriterionId(anyLong(), anyLong(), anyLong())).thenReturn(Optional.empty());
        when(scoreRepository.findBySubmissionId(1L)).thenReturn(List.of(persisted(sub, j, c, "999")));

        scoreService.gradeSubmission(1L, gradeReq(7L, 1L, "999"));

        ArgumentCaptor<Score> cap = ArgumentCaptor.forClass(Score.class);
        verify(scoreRepository).save(cap.capture());
        assertThat(cap.getValue().getScore()).isEqualByComparingTo("999"); // not clamped
    }
}
