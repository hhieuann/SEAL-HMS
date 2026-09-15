package com.fpt.seal.hms.team;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.chapter.ChapterRepository;
import com.fpt.seal.hms.chapter.entity.Chapter;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.team.dto.TeamResponse;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.trackassignment.TrackAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Branch coverage for TeamService.mapToResponse null-guards (mentor name/email,
 *  chapter/track/topic/memberCount) and disqualify status combinations. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamServiceBranchTest {

    @Mock private TeamRepository teamRepository;
    @Mock private ChapterRepository chapterRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private TopicRepository topicRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private EventRepository eventRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private RoundRankingRepository roundRankingRepository;
    @Mock private TrackAssignmentRepository trackAssignmentRepository;
    @Mock private MentorMessageRepository mentorMessageRepository;
    @Mock private AccountService accountService;
    @Mock private com.fpt.seal.hms.auditlog.AuditLogService auditLogService;
    @InjectMocks private TeamService teamService;

    private Team baseTeam() {
        Team t = new Team();
        t.setId(5L);
        t.setName("T5");
        t.setStatus(TeamStatus.IN_PROGRESS);
        return t;
    }

    // ---------- mapToResponse: mentor name/email null-guards ----------

    @Test
    void mentorName_fallsBackToEmail_whenFullNameNull() {
        Team t = baseTeam();
        Account acc = new Account();
        acc.setEmail("mentor@fpt.edu.vn");
        Lecturer mentor = new Lecturer();
        mentor.setId(7L);
        mentor.setFullName(null); // -> use account email
        mentor.setAccount(acc);
        t.setMentor(mentor);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        TeamResponse res = teamService.getTeamById(5L);

        assertThat(res.getMentor().getName()).isEqualTo("mentor@fpt.edu.vn");
        assertThat(res.getMentor().getEmail()).isEqualTo("mentor@fpt.edu.vn");
    }

    @Test
    void mentorName_isUnknown_whenFullNameAndAccountNull() {
        Team t = baseTeam();
        Lecturer mentor = new Lecturer();
        mentor.setId(7L);
        mentor.setFullName(null);
        mentor.setAccount(null); // -> "Unknown" / ""
        t.setMentor(mentor);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        TeamResponse res = teamService.getTeamById(5L);

        assertThat(res.getMentor().getName()).isEqualTo("Unknown");
        assertThat(res.getMentor().getEmail()).isEmpty();
    }

    // ---------- mapToResponse: chapter / track / topic / memberCount ----------

    @Test
    void mapToResponse_populatesChapterTrackTopicAndMemberCount() {
        Team t = baseTeam();
        Chapter chapter = new Chapter();
        chapter.setId(11L);
        t.setChapter(chapter);
        Track track = new Track();
        track.setId(3L);
        t.setTrack(track);
        Topic topic = new Topic();
        topic.setId(30L);
        t.setTopic(topic);
        t.setMemberCount(4);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        TeamResponse res = teamService.getTeamById(5L);

        assertThat(res.getChapterId()).isEqualTo(11L);
        assertThat(res.getTrackId()).isEqualTo(3L);
        assertThat(res.getTopicId()).isEqualTo(30L);
        assertThat(res.getMemberCount()).isEqualTo(4);
    }

    @Test
    void mapToResponse_memberCountNull_defaultsToZero() {
        Team t = baseTeam();
        t.setMemberCount(null); // -> 0
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        assertThat(teamService.getTeamById(5L).getMemberCount()).isZero();
    }

    // ---------- disqualifyTeam: requalify on a non-eliminated team ----------

    @Test
    void requalify_onInProgressTeam_leavesStatusUnchanged() {
        Team t = baseTeam(); // IN_PROGRESS, not DISQUALIFIED/ELIMINATED
        t.setIsDisqualified(false);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.disqualifyTeam(5L, false, null);

        assertThat(res.getStatus()).isEqualTo(TeamStatus.IN_PROGRESS); // no status flip
        assertThat(res.getDisqualificationReason()).isNull();
    }

    @Test
    void requalify_onEliminatedTeam_restoresInProgress() {
        Team t = baseTeam();
        t.setStatus(TeamStatus.ELIMINATED);
        t.setIsDisqualified(false);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.disqualifyTeam(5L, false, null);

        assertThat(res.getStatus()).isEqualTo(TeamStatus.IN_PROGRESS);
    }

    // ---------- adjustment: no judged score yet ----------

    /** Nothing scored yet, so rawScore is null and the derived score is just the adjustment. */
    @Test
    void applyAdjustment_noRawScoreYet_treatsItAsZero() {
        com.fpt.seal.hms.round.entity.Round round = new com.fpt.seal.hms.round.entity.Round();
        round.setId(2L);
        round.setStatus(com.fpt.seal.hms.common.enums.RoundStatus.UNDER_REVIEW);
        com.fpt.seal.hms.roundranking.entity.RoundRanking rr =
                new com.fpt.seal.hms.roundranking.entity.RoundRanking();
        rr.setRound(round);
        when(roundRankingRepository.findByRoundIdAndTeamId(2L, 5L)).thenReturn(Optional.of(rr));
        when(teamRepository.findById(5L)).thenReturn(Optional.of(baseTeam()));

        teamService.applyAdjustment(5L, 2L, new java.math.BigDecimal("10"), "Late", null, null);

        assertThat(rr.getPenaltyPoints()).isEqualByComparingTo("10");
        assertThat(rr.getScore()).isEqualByComparingTo("-10");
        verify(roundRankingRepository).save(rr);
    }
}
