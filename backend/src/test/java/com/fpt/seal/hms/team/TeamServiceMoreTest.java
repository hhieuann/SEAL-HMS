package com.fpt.seal.hms.team;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.chapter.ChapterRepository;
import com.fpt.seal.hms.common.enums.*;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.team.dto.MentorMessageDto;
import com.fpt.seal.hms.team.dto.TeamRequest;
import com.fpt.seal.hms.team.dto.TeamResponse;
import com.fpt.seal.hms.team.entity.MentorMessage;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.teammember.entity.TeamMember;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/** Covers the TeamService paths outside the balanced-draw scenarios of
 *  TeamTrackAssignmentTest: team creation, approval rules, mentor assignment,
 *  disqualification, penalties, and the mentor chat. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamServiceMoreTest {

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
    @InjectMocks private TeamService teamService;

    private Event openEvent() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.UPCOMING);
        e.setRegistrationStartDate(LocalDate.now().minusDays(2));
        e.setRegistrationEndDate(LocalDate.now().plusDays(2));
        e.setMaxTeams(10);
        return e;
    }

    private Team team(long id, TeamStatus status) {
        Team t = new Team();
        t.setId(id);
        t.setName("T" + id);
        t.setStatus(status);
        return t;
    }

    private TeamRequest teamRequest() {
        TeamRequest r = new TeamRequest();
        r.setName("Byte Me");
        r.setLeaderAccountId(20L);
        return r;
    }

    private Account account(long id) {
        Account a = new Account();
        a.setId(id);
        a.setEmail("u" + id + "@fpt.edu.vn");
        a.setRole(Role.STUDENT);
        return a;
    }

    // ---------- createTeam ----------

    @Test
    void createTeam_createsTeamWithCreatorAsAcceptedLeader() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(openEvent()));
        when(teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(20L, 1L, MemberStatus.DECLINED)).thenReturn(List.of());
        when(teamRepository.countByEventId(1L)).thenReturn(3L);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> {
            Team t = inv.getArgument(0);
            t.setId(5L);
            return t;
        });
        when(accountRepository.findByEmail("u20@fpt.edu.vn")).thenReturn(Optional.of(account(20L)));

        TeamResponse res = teamService.createTeam(1L, teamRequest(), "u20@fpt.edu.vn");

        assertThat(res.getName()).isEqualTo("Byte Me");
        assertThat(res.getStatus()).isEqualTo(TeamStatus.CREATED);
        verify(teamMemberRepository).save(argThat(m ->
                m.getRole() == MemberRole.LEADER && m.getStatus() == MemberStatus.ACCEPTED));
        // the body leaderAccountId is ignored: the leader is the authenticated account (20)
        verify(teamMemberRepository).save(argThat(m -> m.getAccount().getId() == 20L));
    }

    @Test
    void createTeam_studentCannotSpoofAnotherLeaderId() {
        // request.leaderAccountId = 20 (spoof) but the authenticated student is account 99
        when(eventRepository.findById(1L)).thenReturn(Optional.of(openEvent()));
        when(accountRepository.findByEmail("u99@fpt.edu.vn")).thenReturn(Optional.of(account(99L)));
        when(teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(99L, 1L, MemberStatus.DECLINED)).thenReturn(List.of());
        when(teamRepository.countByEventId(1L)).thenReturn(0L);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> { Team t = inv.getArgument(0); t.setId(5L); return t; });

        teamService.createTeam(1L, teamRequest(), "u99@fpt.edu.vn"); // teamRequest sets leaderAccountId=20

        // leader is the authenticated user (99), not the spoofed 20
        verify(teamMemberRepository).save(argThat(m -> m.getAccount().getId() == 99L));
        verify(accountRepository, never()).findById(20L);
    }

    @Test
    void createTeam_coordinatorMayCreateOnBehalfWithLeaderAccountId() {
        Account admin = account(1L);
        admin.setRole(Role.ADMIN);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(openEvent()));
        when(accountRepository.findByEmail("admin@seal-hms.local")).thenReturn(Optional.of(admin));
        when(accountRepository.findById(20L)).thenReturn(Optional.of(account(20L))); // the target student
        when(teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(20L, 1L, MemberStatus.DECLINED)).thenReturn(List.of());
        when(teamRepository.countByEventId(1L)).thenReturn(0L);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> { Team t = inv.getArgument(0); t.setId(5L); return t; });

        teamService.createTeam(1L, teamRequest(), "admin@seal-hms.local"); // leaderAccountId=20 honoured for ADMIN

        verify(teamMemberRepository).save(argThat(m -> m.getAccount().getId() == 20L));
    }

    @Test
    void createTeam_rejected_whenCreatorAlreadyInATeamOfThisEvent() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(openEvent()));
        when(accountRepository.findByEmail("u20@fpt.edu.vn")).thenReturn(Optional.of(account(20L)));
        when(teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(20L, 1L, MemberStatus.DECLINED))
                .thenReturn(List.of(new TeamMember()));

        assertThatThrownBy(() -> teamService.createTeam(1L, teamRequest(), "u20@fpt.edu.vn"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already a member of another team");
        verify(teamRepository, never()).save(any());
    }

    @Test
    void createTeam_rejected_whenRegistrationNotStartedOrClosed() {
        Event notStarted = openEvent();
        notStarted.setRegistrationStartDate(LocalDate.now().plusDays(1));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(notStarted));
        when(accountRepository.findByEmail("u20@fpt.edu.vn")).thenReturn(Optional.of(account(20L)));
        when(teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(anyLong(), anyLong(), any())).thenReturn(List.of());

        assertThatThrownBy(() -> teamService.createTeam(1L, teamRequest(), "u20@fpt.edu.vn"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not started");

        Event closed = openEvent();
        closed.setRegistrationEndDate(LocalDate.now().minusDays(1));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(closed));

        assertThatThrownBy(() -> teamService.createTeam(1L, teamRequest(), "u20@fpt.edu.vn"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("closed");
    }

    @Test
    void createTeam_rejected_whenEventFull() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(openEvent()));
        when(accountRepository.findByEmail("u20@fpt.edu.vn")).thenReturn(Optional.of(account(20L)));
        when(teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(anyLong(), anyLong(), any())).thenReturn(List.of());
        when(teamRepository.countByEventId(1L)).thenReturn(10L); // == maxTeams

        assertThatThrownBy(() -> teamService.createTeam(1L, teamRequest(), "u20@fpt.edu.vn"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("maximum number of teams");
    }

    @Test
    void createTeam_throws_whenEventMissing() {
        when(eventRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.createTeam(9L, teamRequest(), "u20@fpt.edu.vn"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- updateTeamStatus (approval 3-5 rule) ----------

    @Test
    void updateTeamStatus_toRegistered_requires3to5AcceptedMembers() {
        Team t = team(5L, TeamStatus.CREATED);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamMemberRepository.countByTeamIdAndStatus(5L, MemberStatus.ACCEPTED)).thenReturn(2L);

        assertThatThrownBy(() -> teamService.updateTeamStatus(5L, TeamStatus.REGISTERED))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("between 3 and 5");

        when(teamMemberRepository.countByTeamIdAndStatus(5L, MemberStatus.ACCEPTED)).thenReturn(6L);
        assertThatThrownBy(() -> teamService.updateTeamStatus(5L, TeamStatus.REGISTERED))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void updateTeamStatus_toRegistered_okWithFourMembers() {
        Team t = team(5L, TeamStatus.CREATED);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamMemberRepository.countByTeamIdAndStatus(5L, MemberStatus.ACCEPTED)).thenReturn(4L);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.updateTeamStatus(5L, TeamStatus.REGISTERED);

        assertThat(res.getStatus()).isEqualTo(TeamStatus.REGISTERED);
    }

    @Test
    void updateTeamStatus_otherStatuses_skipMemberCountCheck() {
        Team t = team(5L, TeamStatus.CREATED);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.updateTeamStatus(5L, TeamStatus.REJECTED);

        assertThat(res.getStatus()).isEqualTo(TeamStatus.REJECTED);
        verify(teamMemberRepository, never()).countByTeamIdAndStatus(anyLong(), any());
    }

    // ---------- random assign: guards + topic + mentor conflict ----------

    @Test
    void assignRandomTrackAndTopic_blockedWhileRegistrationOpen() {
        Team t = team(5L, TeamStatus.REGISTERED);
        Event e = openEvent();
        e.setStatus(EventStatus.UPCOMING);
        t.setEvent(e);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> teamService.assignRandomTrackAndTopic(5L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("registration is still open");
    }

    @Test
    void assignRandomTrackAndTopic_blockedWhenTeamNotRegistered() {
        Team t = team(5L, TeamStatus.CREATED);
        Event e = openEvent();
        e.setStatus(EventStatus.ONGOING);
        t.setEvent(e);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> teamService.assignRandomTrackAndTopic(5L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("APPROVED");
    }

    @Test
    void assignRandomTrackAndTopic_throws_whenNoTracks() {
        Team t = team(5L, TeamStatus.REGISTERED);
        Event e = openEvent();
        e.setStatus(EventStatus.ONGOING);
        t.setEvent(e);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(trackRepository.findByEventId(1L)).thenReturn(List.of());

        assertThatThrownBy(() -> teamService.assignRandomTrackAndTopic(5L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no tracks");
    }

    @Test
    void assignRandomTrackAndTopic_picksTopic_andClearsConflictingMentor() {
        Team t = team(5L, TeamStatus.REGISTERED);
        Event e = openEvent();
        e.setStatus(EventStatus.ONGOING);
        t.setEvent(e);
        Lecturer mentor = new Lecturer();
        mentor.setId(7L);
        t.setMentor(mentor);

        Track track = new Track();
        track.setId(3L);
        track.setName("AI");
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(trackRepository.findByEventId(1L)).thenReturn(List.of(track));
        when(teamRepository.countByTrackId(3L)).thenReturn(0L);
        Topic topic = new Topic();
        topic.setId(30L);
        when(topicRepository.findByTrackId(3L)).thenReturn(List.of(topic));
        // mentor is also JUDGE of the drawn track -> must be cleared
        when(trackAssignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(3L, 7L, AssignmentRole.JUDGE)).thenReturn(true);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.assignRandomTrackAndTopic(5L, 1L);

        assertThat(res.getTrackId()).isEqualTo(3L);
        assertThat(res.getTopicId()).isEqualTo(30L);
        assertThat(res.getMentor()).isNull(); // conflict-of-interest cleared
    }

    // ---------- manual assign guard ----------

    @Test
    void assignTrack_blockedWhileRegistrationOpen() {
        Team t = team(5L, TeamStatus.REGISTERED);
        Event e = openEvent();
        e.setStatus(EventStatus.PLANNED);
        t.setEvent(e);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> teamService.assignTrack(5L, 3L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("registration is still open");
    }

    // ---------- disqualify / requalify ----------

    @Test
    void disqualifyTeam_setsStatusAndReason() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.disqualifyTeam(5L, true, "Cheating");

        assertThat(res.getStatus()).isEqualTo(TeamStatus.DISQUALIFIED);
        assertThat(res.getIsDisqualified()).isTrue();
        assertThat(res.getDisqualificationReason()).isEqualTo("Cheating");
    }

    @Test
    void requalifyTeam_restoresInProgress_andClearsReason() {
        Team t = team(5L, TeamStatus.DISQUALIFIED);
        t.setIsDisqualified(true);
        t.setDisqualificationReason("Cheating");
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.disqualifyTeam(5L, false, null);

        assertThat(res.getStatus()).isEqualTo(TeamStatus.IN_PROGRESS);
        assertThat(res.getDisqualificationReason()).isNull();
    }

    // ---------- penalty ----------

    @Test
    void applyPenalty_adjustsScoreByPenaltyDelta() {
        RoundRanking rr = new RoundRanking();
        rr.setScore(new BigDecimal("80"));
        rr.setPenaltyPoints(new BigDecimal("5")); // existing penalty
        when(roundRankingRepository.findByRoundIdAndTeamId(2L, 5L)).thenReturn(Optional.of(rr));
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        teamService.applyPenalty(5L, 2L, new BigDecimal("10"), "Late");

        // 80 + old(5) - new(10) = 75
        assertThat(rr.getScore()).isEqualByComparingTo("75");
        assertThat(rr.getPenaltyReason()).isEqualTo("Late");
        verify(roundRankingRepository).save(rr);
    }

    @Test
    void applyPenalty_zeroPenalty_revertsOldDeduction() {
        RoundRanking rr = new RoundRanking();
        rr.setScore(new BigDecimal("70"));
        rr.setPenaltyPoints(new BigDecimal("10"));
        when(roundRankingRepository.findByRoundIdAndTeamId(2L, 5L)).thenReturn(Optional.of(rr));
        when(teamRepository.findById(5L)).thenReturn(Optional.of(team(5L, TeamStatus.IN_PROGRESS)));

        teamService.applyPenalty(5L, 2L, BigDecimal.ZERO, "revert");

        assertThat(rr.getScore()).isEqualByComparingTo("80"); // 70 + 10 - 0
    }

    @Test
    void applyPenalty_throws_whenNoRanking() {
        when(roundRankingRepository.findByRoundIdAndTeamId(2L, 5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.applyPenalty(5L, 2L, BigDecimal.ONE, "x"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- mentor assignment ----------

    @Test
    void assignMentor_null_removesMentor() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        t.setMentor(new Lecturer());
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.assignMentor(5L, null);

        assertThat(res.getMentor()).isNull();
    }

    @Test
    void assignMentor_requiresTrackFirst() {
        Team t = team(5L, TeamStatus.IN_PROGRESS); // no track
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> teamService.assignMentor(5L, 7L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("track before a mentor");
    }

    @Test
    void assignMentor_rejectsJudgeOfSameTrack() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        Track track = new Track();
        track.setId(3L);
        t.setTrack(track);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        Lecturer lect = new Lecturer();
        lect.setId(7L);
        when(lecturerRepository.findById(7L)).thenReturn(Optional.of(lect));
        when(trackAssignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(3L, 7L, AssignmentRole.JUDGE)).thenReturn(true);

        assertThatThrownBy(() -> teamService.assignMentor(5L, 7L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cannot also be a Mentor");
    }

    @Test
    void assignMentor_setsMentor_whenNoConflict() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        Track track = new Track();
        track.setId(3L);
        t.setTrack(track);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        Account acc = account(70L);
        Lecturer lect = new Lecturer();
        lect.setId(7L);
        lect.setFullName("Mentor M");
        lect.setAccount(acc);
        when(lecturerRepository.findById(7L)).thenReturn(Optional.of(lect));
        when(trackAssignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(3L, 7L, AssignmentRole.JUDGE)).thenReturn(false);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamResponse res = teamService.assignMentor(5L, 7L);

        assertThat(res.getMentor().getName()).isEqualTo("Mentor M");
    }

    // ---------- mentor chat + reset ----------

    @Test
    void resetAllMentorsByEvent_clearsMentorsAndChats() {
        Team t1 = team(5L, TeamStatus.IN_PROGRESS);
        t1.setMentor(new Lecturer());
        when(teamRepository.findByEventId(1L)).thenReturn(List.of(t1));
        MentorMessage msg = new MentorMessage();
        when(mentorMessageRepository.findByTeamIdOrderByCreatedAtAsc(5L)).thenReturn(List.of(msg));

        teamService.resetAllMentorsByEvent(1L);

        assertThat(t1.getMentor()).isNull();
        verify(mentorMessageRepository).deleteAll(List.of(msg));
        verify(teamRepository).saveAll(any());
    }

    @Test
    void sendMentorMessage_persists_andResolvesSenderName() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        Account sender = account(20L);
        when(accountRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(teamMemberRepository.findByTeamIdAndAccountId(5L, 20L)).thenReturn(Optional.of(new TeamMember())); // sender is a member
        when(accountService.getFullName(sender)).thenReturn("An Nguyen");
        when(mentorMessageRepository.save(any(MentorMessage.class))).thenAnswer(inv -> {
            MentorMessage m = inv.getArgument(0);
            m.setId(99L);
            return m;
        });

        MentorMessageDto dto = teamService.sendMentorMessageByEmail(5L, sender.getEmail(), "Hello mentor");

        assertThat(dto.getMessage()).isEqualTo("Hello mentor");
        assertThat(dto.getSenderName()).isEqualTo("An Nguyen");
        assertThat(dto.getSenderRole()).isEqualTo("STUDENT");
    }

    @Test
    void sendMentorMessage_fallsBackToEmailPrefix_whenNoFullName() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        Account sender = account(20L); // u20@fpt.edu.vn
        when(accountRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(teamMemberRepository.findByTeamIdAndAccountId(5L, 20L)).thenReturn(Optional.of(new TeamMember()));
        when(accountService.getFullName(sender)).thenReturn(null);
        when(mentorMessageRepository.save(any(MentorMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        MentorMessageDto dto = teamService.sendMentorMessageByEmail(5L, sender.getEmail(), "Hi");

        assertThat(dto.getSenderName()).isEqualTo("u20");
    }

    @Test
    void getMentorMessages_mapsAllMessages() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        Account sender = account(20L);
        when(accountRepository.findByEmail("u20@fpt.edu.vn")).thenReturn(Optional.of(sender));
        when(teamMemberRepository.findByTeamIdAndAccountId(5L, 20L)).thenReturn(Optional.of(new TeamMember()));
        MentorMessage m = new MentorMessage();
        m.setId(1L);
        m.setTeam(t);
        m.setSender(sender);
        m.setMessage("First");
        when(mentorMessageRepository.findByTeamIdOrderByCreatedAtAsc(5L)).thenReturn(List.of(m));
        when(accountService.getFullName(sender)).thenReturn("An");

        List<MentorMessageDto> out = teamService.getMentorMessages(5L, "u20@fpt.edu.vn");

        assertThat(out).hasSize(1);
        assertThat(out.get(0).getMessage()).isEqualTo("First");
    }

    // ---------- mentor chat authorization (IDOR) ----------

    @Test
    void getMentorMessages_rejectsNonMemberNonMentor() {
        Team t = team(5L, TeamStatus.IN_PROGRESS); // no mentor
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        Account outsider = account(77L); // STUDENT, not a member
        when(accountRepository.findByEmail("outsider@fpt.edu.vn")).thenReturn(Optional.of(outsider));
        when(teamMemberRepository.findByTeamIdAndAccountId(5L, 77L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.getMentorMessages(5L, "outsider@fpt.edu.vn"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not allowed to access");
        verify(mentorMessageRepository, never()).findByTeamIdOrderByCreatedAtAsc(any());
    }

    @Test
    void sendMentorMessage_rejectsOutsider() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        Account outsider = account(77L);
        when(accountRepository.findByEmail("outsider@fpt.edu.vn")).thenReturn(Optional.of(outsider));
        when(teamMemberRepository.findByTeamIdAndAccountId(5L, 77L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.sendMentorMessageByEmail(5L, "outsider@fpt.edu.vn", "sneaky"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not allowed to access");
        verify(mentorMessageRepository, never()).save(any());
    }

    @Test
    void getMentorMessages_allowsTheAssignedMentor() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        Account mentorAcc = account(30L);
        mentorAcc.setEmail("mentor@fpt.edu.vn");
        Lecturer mentor = new Lecturer();
        mentor.setId(9L);
        mentor.setAccount(mentorAcc);
        t.setMentor(mentor);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(accountRepository.findByEmail("mentor@fpt.edu.vn")).thenReturn(Optional.of(mentorAcc));
        when(teamMemberRepository.findByTeamIdAndAccountId(5L, 30L)).thenReturn(Optional.empty()); // not a member, but the mentor
        when(mentorMessageRepository.findByTeamIdOrderByCreatedAtAsc(5L)).thenReturn(List.of());

        assertThat(teamService.getMentorMessages(5L, "mentor@fpt.edu.vn")).isEmpty(); // allowed
    }

    @Test
    void getMentorMessages_allowsAdminStaff() {
        Team t = team(5L, TeamStatus.IN_PROGRESS);
        Account admin = account(1L);
        admin.setRole(Role.ADMIN);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(t));
        when(accountRepository.findByEmail("admin@seal-hms.local")).thenReturn(Optional.of(admin));
        when(mentorMessageRepository.findByTeamIdOrderByCreatedAtAsc(5L)).thenReturn(List.of());

        assertThat(teamService.getMentorMessages(5L, "admin@seal-hms.local")).isEmpty(); // ADMIN bypasses membership
    }

    // ---------- reads ----------

    @Test
    void getTeamsByEventId_mapsTeams() {
        when(teamRepository.findByEventId(1L)).thenReturn(List.of(team(5L, TeamStatus.CREATED)));

        assertThat(teamService.getTeamsByEventId(1L)).hasSize(1);
    }

    @Test
    void getTeamById_throws_whenMissing() {
        when(teamRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.getTeamById(9L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
