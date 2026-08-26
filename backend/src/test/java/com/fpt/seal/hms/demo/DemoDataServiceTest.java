package com.fpt.seal.hms.demo;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.auditlog.AuditLogService;
import com.fpt.seal.hms.common.enums.AssignmentRole;
import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.criterion.CriterionRepository;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.round.RoundRepository;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.score.entity.Score;
import com.fpt.seal.hms.student.StudentRepository;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.submission.entity.Submission;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.trackassignment.TrackAssignment;
import com.fpt.seal.hms.trackassignment.TrackAssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DemoDataServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private EventRepository eventRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private TopicRepository topicRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private CriterionRepository criterionRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private TrackAssignmentRepository trackAssignmentRepository;
    @Mock private RoundRankingRepository roundRankingRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private ScoreRepository scoreRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditLogService auditLogService;
    @InjectMocks private DemoDataService service;

    /** Give every save an id, as JPA would, and keep what was saved for assertions. */
    private final List<Track> savedTracks = new ArrayList<>();
    private final List<Round> savedRounds = new ArrayList<>();
    private final List<Team> savedTeams = new ArrayList<>();
    private final List<Criterion> savedCriteria = new ArrayList<>();
    private final List<TrackAssignment> savedAssignments = new ArrayList<>();

    @BeforeEach
    void wireSaves() {
        AtomicLong ids = new AtomicLong(1);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(eventRepository.save(any())).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            if (e.getId() == null) e.setId(ids.incrementAndGet());
            return e;
        });
        when(trackRepository.save(any())).thenAnswer(inv -> {
            Track t = inv.getArgument(0);
            if (t.getId() == null) t.setId(ids.incrementAndGet());
            savedTracks.add(t);
            return t;
        });
        when(roundRepository.save(any())).thenAnswer(inv -> {
            Round r = inv.getArgument(0);
            if (r.getId() == null) r.setId(ids.incrementAndGet());
            if (!savedRounds.contains(r)) savedRounds.add(r);
            return r;
        });
        when(criterionRepository.save(any())).thenAnswer(inv -> {
            Criterion c = inv.getArgument(0);
            if (c.getId() == null) c.setId(ids.incrementAndGet());
            savedCriteria.add(c);
            return c;
        });
        when(teamRepository.save(any())).thenAnswer(inv -> {
            Team t = inv.getArgument(0);
            if (t.getId() == null) t.setId(ids.incrementAndGet());
            if (!savedTeams.contains(t)) savedTeams.add(t);
            return t;
        });
        when(accountRepository.save(any())).thenAnswer(inv -> {
            Account a = inv.getArgument(0);
            if (a.getId() == null) a.setId(ids.incrementAndGet());
            return a;
        });
        when(lecturerRepository.save(any())).thenAnswer(inv -> {
            Lecturer l = inv.getArgument(0);
            if (l.getId() == null) l.setId(ids.incrementAndGet());
            return l;
        });
        when(roundRankingRepository.save(any())).thenAnswer(inv -> {
            RoundRanking rr = inv.getArgument(0);
            if (rr.getId() == null) rr.setId(ids.incrementAndGet());
            return rr;
        });
        when(submissionRepository.save(any())).thenAnswer(inv -> {
            Submission s = inv.getArgument(0);
            if (s.getId() == null) s.setId(ids.incrementAndGet());
            return s;
        });
        when(trackAssignmentRepository.save(any())).thenAnswer(inv -> {
            TrackAssignment a = inv.getArgument(0);
            savedAssignments.add(a);
            return a;
        });
        when(accountRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(lecturerRepository.findByAccount_Id(any())).thenReturn(Optional.empty());
        when(teamRepository.existsByInviteCode(any())).thenReturn(false);
        when(topicRepository.findByEventId(any())).thenAnswer(inv -> {
            List<Topic> topics = new ArrayList<>();
            for (Track t : savedTracks) {
                Topic topic = new Topic();
                topic.setTrack(t);
                topic.setName("Topic for " + t.getName());
                topics.add(topic);
            }
            return topics;
        });
        when(criterionRepository.findByRoundId(any())).thenAnswer(inv ->
                savedCriteria.stream().filter(c -> c.getRound() != null
                        && c.getRound().getId().equals(inv.getArgument(0))).toList());
        when(trackAssignmentRepository.findByEventId(any())).thenReturn(savedAssignments);
    }

    private DemoSeedRequest request(DemoStage stage, int teams, int tracks) {
        DemoSeedRequest r = new DemoSeedRequest();
        r.setStage(stage);
        r.setTeams(teams);
        r.setTracks(tracks);
        r.setMembersPerTeam(2);
        return r;
    }

    @Test
    void seed_setupStage_buildsStructureButNoTeams() {
        DemoSeedResult result = service.seed(request(DemoStage.SETUP, 4, 2));

        assertThat(result.teams()).isZero();
        assertThat(savedTracks).hasSize(2);
        assertThat(savedRounds).hasSize(2);
        assertThat(savedCriteria).hasSize(8); // 4 criteria on each of 2 rounds
        verify(teamRepository, never()).save(any());
    }

    /** A round's criteria must total 100%, or the event form would reject the event. */
    @Test
    void seed_criteriaWeightsSumToOnePerRound() {
        service.seed(request(DemoStage.SETUP, 4, 2));

        for (Round round : savedRounds) {
            java.math.BigDecimal total = savedCriteria.stream()
                    .filter(c -> c.getRound().getId().equals(round.getId()))
                    .map(Criterion::getWeight)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            assertThat(total).isEqualByComparingTo("1.00");
        }
    }

    @Test
    void seed_teamsStage_createsTeamsWithOneLeaderEach() {
        DemoSeedResult result = service.seed(request(DemoStage.TEAMS, 4, 2));

        assertThat(result.teams()).isEqualTo(4);
        assertThat(result.students()).isEqualTo(8); // 4 teams x 2 members
        ArgumentCaptor<TeamMember> members = ArgumentCaptor.forClass(TeamMember.class);
        verify(teamMemberRepository, times(8)).save(members.capture());
        long leaders = members.getAllValues().stream()
                .filter(m -> m.getRole() == com.fpt.seal.hms.common.enums.MemberRole.LEADER).count();
        assertThat(leaders).isEqualTo(4);
        // teams exist but the draw has not run
        assertThat(savedTeams).allMatch(t -> t.getTrack() == null);
    }

    @Test
    void seed_drawnStage_spreadsTeamsAcrossTracks_andAssignsJudges() {
        service.seed(request(DemoStage.DRAWN, 4, 2));

        assertThat(savedTeams).allMatch(t -> t.getTrack() != null);
        long trackA = savedTeams.stream().filter(t -> t.getTrack().getName().equals("Track A")).count();
        assertThat(trackA).isEqualTo(2); // round-robin, so evenly split
        assertThat(savedAssignments).hasSize(2).allMatch(a -> a.getRole() == AssignmentRole.JUDGE);
        assertThat(savedTeams).allMatch(t -> t.getStatus() == TeamStatus.IN_PROGRESS);
    }

    /** The seed must not create the conflict the app forbids: judge and mentor on one track. */
    @Test
    void seed_neverMakesOneLecturerBothJudgeAndMentorOfTheSameTrack() {
        service.seed(request(DemoStage.DRAWN, 6, 3));

        for (TrackAssignment judge : savedAssignments) {
            Long judgeLecturerId = judge.getLecturer().getId();
            boolean mentorsInSameTrack = savedTeams.stream()
                    .filter(t -> t.getTrack().getId().equals(judge.getTrack().getId()))
                    .anyMatch(t -> t.getMentor() != null && t.getMentor().getId().equals(judgeLecturerId));
            assertThat(mentorsInSameTrack).isFalse();
        }
    }

    @Test
    void seed_scoredStage_leavesTheFirstRoundUnderReviewWithScores() {
        service.seed(request(DemoStage.SCORED, 4, 2));

        verify(submissionRepository, times(4)).save(any());
        verify(scoreRepository, atLeast(4 * 4)).save(any(Score.class)); // 4 criteria per team
        Round first = savedRounds.get(0);
        assertThat(first.getStatus()).isEqualTo(RoundStatus.UNDER_REVIEW);
    }

    @Test
    void seed_scoredStage_derivesRoundScoresOnTheZeroToHundredScale() {
        service.seed(request(DemoStage.SCORED, 4, 2));

        ArgumentCaptor<RoundRanking> cap = ArgumentCaptor.forClass(RoundRanking.class);
        verify(roundRankingRepository, atLeastOnce()).save(cap.capture());
        assertThat(cap.getAllValues()).filteredOn(rr -> rr.getRawScore() != null)
                .allSatisfy(rr -> {
                    assertThat(rr.getRawScore()).isBetween(new java.math.BigDecimal("50"), new java.math.BigDecimal("100"));
                    assertThat(rr.getScore()).isEqualByComparingTo(rr.getRawScore()); // no penalties yet
                });
    }

    @Test
    void seed_namesTheEventSoItIsObviouslyDemoData() {
        DemoSeedResult result = service.seed(request(DemoStage.SETUP, 4, 2));

        assertThat(result.eventName()).startsWith(DemoDataService.DEMO_EVENT_PREFIX);
    }

    @Test
    void seed_eventStartsPlanned_untilTheDrawHappens() {
        service.seed(request(DemoStage.TEAMS, 4, 2));

        ArgumentCaptor<Event> cap = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository, atLeastOnce()).save(cap.capture());
        assertThat(cap.getValue().getStatus()).isEqualTo(EventStatus.PLANNED);
    }

    @Test
    void seed_rejectsFewerTeamsThanTracks() {
        assertThatThrownBy(() -> service.seed(request(DemoStage.TEAMS, 2, 4)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("at least as many teams as tracks");
    }

    // ---------- purge ----------

    @Test
    void purge_removesOnlyDemoEventsAndDemoAccounts() {
        Event demo = new Event();
        demo.setId(1L);
        demo.setName(DemoDataService.DEMO_EVENT_PREFIX + "Hackathon 2026");
        Event real = new Event();
        real.setId(2L);
        real.setName("SEAL Spring 2026");
        when(eventRepository.findAll()).thenReturn(List.of(demo, real));
        when(roundRepository.findByEventId(1L)).thenReturn(List.of());
        when(teamRepository.findByEventId(1L)).thenReturn(List.of());
        when(trackRepository.findByEventId(1L)).thenReturn(List.of());
        when(topicRepository.findByEventId(1L)).thenReturn(List.of());

        Account demoAccount = new Account();
        demoAccount.setId(10L);
        demoAccount.setEmail("student0-0" + DemoDataService.DEMO_EMAIL_DOMAIN);
        Account realAccount = new Account();
        realAccount.setId(11L);
        realAccount.setEmail("student@seal-hms.local");
        when(accountRepository.findAll()).thenReturn(List.of(demoAccount, realAccount));
        when(studentRepository.findByAccount_Id(10L)).thenReturn(Optional.empty());
        when(lecturerRepository.findByAccount_Id(10L)).thenReturn(Optional.empty());

        DemoPurgeResult result = service.purge();

        assertThat(result.eventsRemoved()).isEqualTo(1);
        assertThat(result.accountsRemoved()).isEqualTo(1);
        verify(eventRepository).delete(demo);
        verify(eventRepository, never()).delete(real);
        ArgumentCaptor<List<Account>> accounts = ArgumentCaptor.forClass(List.class);
        verify(accountRepository).deleteAll(accounts.capture());
        assertThat(accounts.getValue()).containsExactly(demoAccount);
    }

    @Test
    void purge_withNothingSeeded_isANoOp() {
        when(eventRepository.findAll()).thenReturn(List.of());
        when(accountRepository.findAll()).thenReturn(List.of());

        DemoPurgeResult result = service.purge();

        assertThat(result.eventsRemoved()).isZero();
        assertThat(result.accountsRemoved()).isZero();
        verify(eventRepository, never()).delete(any());
    }
}
