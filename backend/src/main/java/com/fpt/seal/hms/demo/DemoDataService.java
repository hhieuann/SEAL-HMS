package com.fpt.seal.hms.demo;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.*;
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
import com.fpt.seal.hms.student.Student;
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
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Builds a complete demo event in one call, so showing the system to somebody does not start
 * with twenty minutes of form filling.
 *
 * Two rules keep this safe to have in the codebase:
 *
 * 1. It only ever creates. Nothing here updates or deletes anything that already existed.
 * 2. Everything it creates is reachable from one event, and the demo accounts it needs all
 *    live on a single reserved email domain — so {@link #purge()} can remove exactly what was
 *    seeded and nothing else.
 *
 * The endpoint that reaches it is switched off unless {@code app.demo.enabled} is true, so it
 * does not exist at all in a normal deployment.
 */
@Service
@RequiredArgsConstructor
public class DemoDataService {

    /** Demo accounts live here and nowhere else; purge keys off this. */
    public static final String DEMO_EMAIL_DOMAIN = "@demo.seal-hms.local";
    /** Prefixed onto seeded event names so they are obvious in the events list. */
    public static final String DEMO_EVENT_PREFIX = "[DEMO] ";
    private static final String DEMO_PASSWORD = "Demo@12345";

    private final AccountRepository accountRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final EventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final TopicRepository topicRepository;
    private final RoundRepository roundRepository;
    private final CriterionRepository criterionRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TrackAssignmentRepository trackAssignmentRepository;
    private final RoundRankingRepository roundRankingRepository;
    private final SubmissionRepository submissionRepository;
    private final ScoreRepository scoreRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.fpt.seal.hms.auditlog.AuditLogService auditLogService;

    /** Fixed seed so two demos of the same shape produce the same scores — easier to talk over. */
    private final Random random = new Random(42);

    private static final String[] TOPIC_NAMES = {
            "Medical knowledge RAG", "Campus navigation", "Study-group matcher",
            "Cafeteria queue predictor", "Lecture summariser", "Lost and found"
    };
    private static final String[] TEAM_NAMES = {
            "Null Pointers", "Stack Overflow", "Merge Conflict", "Segfault", "Race Condition",
            "Off By One", "Rubber Ducks", "Infinite Loop", "Dangling Pointer", "Heap Overflow",
            "Deadlock", "Cache Miss", "Bit Shift", "Tail Call", "Fork Bomb", "Kernel Panic",
            "Regex Wizards", "Semaphore", "Mutex Lock", "Garbage Collectors", "Thread Pool",
            "Load Balancers", "Rate Limiters", "Circuit Breakers", "Idempotent", "Eventual",
            "Quorum", "Consensus", "Bloom Filter", "Trie Hard"
    };
    private static final String[][] CRITERIA = {
            {"Innovation", "30"}, {"Technical execution", "30"},
            {"Impact", "20"}, {"Presentation", "20"}
    };

    @Transactional
    public DemoSeedResult seed(DemoSeedRequest request) {
        int teamCount = request.getTeams();
        int trackCount = request.getTracks();
        int membersPerTeam = request.getMembersPerTeam();
        DemoStage stage = request.getStage();

        if (teamCount < trackCount) {
            throw new com.fpt.seal.hms.common.exception.BusinessException(
                    "Need at least as many teams as tracks, otherwise a track ends up empty.");
        }

        Event event = createEvent(request.getEventName(), teamCount);
        List<Track> tracks = createTracks(event, trackCount);
        createTopics(event, tracks);
        List<Round> rounds = createRounds(event, teamCount);

        DemoSeedResult result = new DemoSeedResult(event.getId(), event.getName(), stage.name(),
                0, 0, 0, DEMO_PASSWORD);
        if (stage == DemoStage.SETUP) {
            log(event, stage, 0);
            return result;
        }

        List<Team> teams = createTeams(event, teamCount, membersPerTeam);
        result = result.withTeams(teams.size(), teams.size() * membersPerTeam);
        if (stage == DemoStage.TEAMS) {
            log(event, stage, teams.size());
            return result;
        }

        drawTracks(teams, tracks);
        int assignments = assignJudgesAndMentors(tracks, teams);
        Round firstRound = rounds.get(0);
        firstRound.setStatus(RoundStatus.ACTIVE);
        roundRepository.save(firstRound);
        event.setStatus(EventStatus.ONGOING);
        eventRepository.save(event);
        result = result.withAssignments(assignments);
        if (stage == DemoStage.DRAWN) {
            log(event, stage, teams.size());
            return result;
        }

        scoreFirstRound(firstRound, teams);
        firstRound.setStatus(RoundStatus.UNDER_REVIEW);
        roundRepository.save(firstRound);
        log(event, stage, teams.size());
        return result;
    }

    /**
     * Remove every demo event and demo account. Anything created by hand is untouched, because
     * the only things this deletes are events whose name carries the demo prefix and accounts on
     * the reserved domain.
     */
    @Transactional
    public DemoPurgeResult purge() {
        List<Event> demoEvents = eventRepository.findAll().stream()
                .filter(e -> e.getName() != null && e.getName().startsWith(DEMO_EVENT_PREFIX))
                .toList();

        int events = 0;
        for (Event event : demoEvents) {
            deleteEventContents(event);
            eventRepository.delete(event);
            events++;
        }

        List<Account> demoAccounts = accountRepository.findAll().stream()
                .filter(a -> a.getEmail() != null && a.getEmail().endsWith(DEMO_EMAIL_DOMAIN))
                .toList();
        for (Account account : demoAccounts) {
            studentRepository.findByAccount_Id(account.getId()).ifPresent(studentRepository::delete);
            lecturerRepository.findByAccount_Id(account.getId()).ifPresent(lecturerRepository::delete);
        }
        accountRepository.deleteAll(demoAccounts);

        auditLogService.log("DEMO_DATA_PURGED", "event", null,
                events + " demo events, " + demoAccounts.size() + " demo accounts");
        return new DemoPurgeResult(events, demoAccounts.size());
    }

    // ------------------------------------------------------------------ building blocks

    private Event createEvent(String name, int teamCount) {
        Event event = new Event();
        String label = (name == null || name.isBlank()) ? "Hackathon " + LocalDate.now().getYear() : name.trim();
        event.setName(DEMO_EVENT_PREFIX + label);
        event.setType("Hackathon");
        event.setDescription("Seeded demo data. Safe to delete.");
        event.setStatus(EventStatus.PLANNED);
        event.setRegistrationStartDate(LocalDate.now().minusDays(14));
        event.setRegistrationEndDate(LocalDate.now().minusDays(1));
        event.setStartDate(LocalDate.now());
        event.setEndDate(LocalDate.now().plusDays(7));
        event.setMinTeams(2);
        event.setMaxTeams(Math.max(teamCount, 2));
        return eventRepository.save(event);
    }

    private List<Track> createTracks(Event event, int count) {
        List<Track> tracks = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Track track = new Track();
            track.setEvent(event);
            track.setName("Track " + (char) ('A' + i));
            track.setDescription("Demo track");
            track.setMaxTeams(50);
            tracks.add(trackRepository.save(track));
        }
        return tracks;
    }

    private void createTopics(Event event, List<Track> tracks) {
        for (int i = 0; i < tracks.size(); i++) {
            Topic topic = new Topic();
            topic.setEvent(event);
            topic.setTrack(tracks.get(i));
            topic.setName(TOPIC_NAMES[i % TOPIC_NAMES.length]);
            topic.setDescription("Demo problem statement");
            topicRepository.save(topic);
        }
    }

    private List<Round> createRounds(Event event, int teamCount) {
        List<Round> rounds = new ArrayList<>();
        int promoted = Math.max(2, teamCount / 2);

        Round qualifier = new Round();
        qualifier.setEvent(event);
        qualifier.setName("Qualifying Round");
        qualifier.setRoundSeq(1);
        qualifier.setStartTime(LocalDateTime.now().withHour(9).withMinute(0).withSecond(0).withNano(0));
        qualifier.setDurationHours(24.0);
        qualifier.setPromotionTopN(promoted);
        qualifier.setStatus(RoundStatus.CREATED);
        rounds.add(roundRepository.save(qualifier));

        Round finals = new Round();
        finals.setEvent(event);
        finals.setName("Final Round");
        finals.setRoundSeq(2);
        finals.setStartTime(LocalDateTime.now().plusDays(3).withHour(9).withMinute(0).withSecond(0).withNano(0));
        finals.setDurationHours(24.0);
        finals.setStatus(RoundStatus.CREATED);
        rounds.add(roundRepository.save(finals));

        for (Round round : rounds) {
            for (String[] spec : CRITERIA) {
                Criterion criterion = new Criterion();
                criterion.setRound(round);
                criterion.setName(spec[0]);
                criterion.setMaxScore(new BigDecimal("10"));
                // weights are stored 0..1 and sum to 1.0 across a round
                criterion.setWeight(new BigDecimal(spec[1]).divide(new BigDecimal("100")));
                criterionRepository.save(criterion);
            }
        }
        return rounds;
    }

    private List<Team> createTeams(Event event, int teamCount, int membersPerTeam) {
        List<Team> teams = new ArrayList<>();
        for (int i = 0; i < teamCount; i++) {
            Team team = new Team();
            team.setEvent(event);
            team.setName(TEAM_NAMES[i % TEAM_NAMES.length]);
            team.setStatus(TeamStatus.REGISTERED);
            team.setInviteCode(uniqueInviteCode());
            Team saved = teamRepository.save(team);

            for (int m = 0; m < membersPerTeam; m++) {
                Account account = createStudentAccount(i, m);
                TeamMember member = new TeamMember();
                member.setTeam(saved);
                member.setAccount(account);
                member.setRole(m == 0 ? MemberRole.LEADER : MemberRole.MEMBER);
                member.setStatus(MemberStatus.ACCEPTED);
                teamMemberRepository.save(member);
            }
            teams.add(saved);
        }
        return teams;
    }

    private Account createStudentAccount(int teamIndex, int memberIndex) {
        String email = "student" + teamIndex + "-" + memberIndex + DEMO_EMAIL_DOMAIN;
        Account existing = accountRepository.findByEmail(email).orElse(null);
        if (existing != null) return existing;

        Account account = new Account();
        account.setEmail(email);
        account.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
        account.setRole(Role.STUDENT);
        account.setStatus(AccountStatus.ACTIVE);
        Account saved = accountRepository.save(account);

        Student student = new Student();
        student.setAccount(saved);
        student.setFirstName("Demo");
        student.setLastName("Student " + teamIndex + "-" + memberIndex);
        student.setStudentCode(String.format("SE%06d", 900000 + teamIndex * 10 + memberIndex));
        student.setCampus("FPT University HCMC");
        studentRepository.save(student);
        return saved;
    }

    private Lecturer createLecturerAccount(int index, String label) {
        String email = "lecturer" + index + DEMO_EMAIL_DOMAIN;
        Account account = accountRepository.findByEmail(email).orElseGet(() -> {
            Account fresh = new Account();
            fresh.setEmail(email);
            fresh.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
            fresh.setRole(Role.LECTURER);
            fresh.setStatus(AccountStatus.ACTIVE);
            return accountRepository.save(fresh);
        });
        return lecturerRepository.findByAccount_Id(account.getId()).orElseGet(() -> {
            Lecturer lecturer = new Lecturer();
            lecturer.setAccount(account);
            lecturer.setFullName("Demo " + label + " " + index);
            lecturer.setDepartment("Software Engineering");
            lecturer.setCampus("FPT University HCMC");
            return lecturerRepository.save(lecturer);
        });
    }

    /** Round-robin so every track ends up with a similar number of teams. */
    private void drawTracks(List<Team> teams, List<Track> tracks) {
        List<Topic> topics = topicRepository.findByEventId(teams.get(0).getEvent().getId());
        for (int i = 0; i < teams.size(); i++) {
            Team team = teams.get(i);
            Track track = tracks.get(i % tracks.size());
            team.setTrack(track);
            topics.stream()
                    .filter(t -> t.getTrack() != null && t.getTrack().getId().equals(track.getId()))
                    .findFirst()
                    .ifPresent(team::setTopic);
            team.setStatus(TeamStatus.IN_PROGRESS);
            teamRepository.save(team);
        }
    }

    /**
     * One judge per track, and one mentor per track's teams. Kept on separate lecturers so the
     * conflict-of-interest rule is never breached by the seed itself.
     */
    private int assignJudgesAndMentors(List<Track> tracks, List<Team> teams) {
        int count = 0;
        for (int i = 0; i < tracks.size(); i++) {
            Track track = tracks.get(i);
            Lecturer judge = createLecturerAccount(i, "Judge");
            TrackAssignment assignment = new TrackAssignment();
            assignment.setTrack(track);
            assignment.setLecturer(judge);
            assignment.setRole(AssignmentRole.JUDGE);
            assignment.setScoringCompleted(false);
            trackAssignmentRepository.save(assignment);
            count++;

            Lecturer mentor = createLecturerAccount(100 + i, "Mentor");
            for (Team team : teams) {
                if (team.getTrack() != null && team.getTrack().getId().equals(track.getId())) {
                    team.setMentor(mentor);
                    teamRepository.save(team);
                    count++;
                }
            }
        }
        return count;
    }

    /** Every team submits, every assigned judge scores every criterion for its own track. */
    private void scoreFirstRound(Round round, List<Team> teams) {
        List<Criterion> criteria = criterionRepository.findByRoundId(round.getId());
        List<TrackAssignment> judges = trackAssignmentRepository.findByEventId(round.getEvent().getId()).stream()
                .filter(a -> a.getRole() == AssignmentRole.JUDGE)
                .toList();

        for (Team team : teams) {
            RoundRanking ranking = new RoundRanking();
            ranking.setRound(round);
            ranking.setTeam(team);
            RoundRanking savedRanking = roundRankingRepository.save(ranking);

            Submission submission = new Submission();
            submission.setRoundRanking(savedRanking);
            submission.setSubmissionName(team.getName() + " — round 1");
            submission.setDescription("Demo submission");
            submission.setTechStackName("React, Spring Boot, PostgreSQL");
            submission.setGithubUrl("https://github.com/example/demo");
            submission.setStatus(SubmissionStatus.LOCKED);
            Submission savedSubmission = submissionRepository.save(submission);

            BigDecimal weighted = BigDecimal.ZERO;
            int judgeCount = 0;
            for (TrackAssignment judgeAssignment : judges) {
                if (team.getTrack() == null
                        || !judgeAssignment.getTrack().getId().equals(team.getTrack().getId())) {
                    continue;
                }
                judgeCount++;
                Account judgeAccount = judgeAssignment.getLecturer().getAccount();
                for (Criterion criterion : criteria) {
                    BigDecimal value = BigDecimal.valueOf(6 + random.nextInt(5)); // 6..10
                    Score score = new Score();
                    score.setSubmission(savedSubmission);
                    score.setJudgeAccount(judgeAccount);
                    score.setCriterion(criterion);
                    score.setScore(value);
                    score.setComment("Demo score");
                    scoreRepository.save(score);

                    weighted = weighted.add(value
                            .divide(criterion.getMaxScore(), 4, java.math.RoundingMode.HALF_UP)
                            .multiply(criterion.getWeight()));
                }
            }

            if (judgeCount > 0) {
                savedRanking.setRawScore(weighted.multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(judgeCount), 2, java.math.RoundingMode.HALF_UP));
                savedRanking.recomputeScore();
                roundRankingRepository.save(savedRanking);
            }
        }
    }

    /** Children first, so the event row can go without tripping a foreign key. */
    private void deleteEventContents(Event event) {
        Long eventId = event.getId();
        for (Round round : roundRepository.findByEventId(eventId)) {
            for (RoundRanking ranking : roundRankingRepository.findByRoundId(round.getId())) {
                submissionRepository.findByRoundRankingId(ranking.getId()).ifPresent(submission -> {
                    scoreRepository.deleteAll(scoreRepository.findBySubmissionId(submission.getId()));
                    submissionRepository.delete(submission);
                });
                roundRankingRepository.delete(ranking);
            }
            criterionRepository.deleteAll(criterionRepository.findByRoundId(round.getId()));
            roundRepository.delete(round);
        }
        for (Team team : teamRepository.findByEventId(eventId)) {
            teamMemberRepository.deleteAll(teamMemberRepository.findByTeamId(team.getId()));
            team.setMentor(null);
            teamRepository.save(team);
            teamRepository.delete(team);
        }
        for (Track track : trackRepository.findByEventId(eventId)) {
            trackAssignmentRepository.deleteAll(trackAssignmentRepository.findByTrack_Id(track.getId()));
        }
        topicRepository.deleteAll(topicRepository.findByEventId(eventId));
        trackRepository.deleteAll(trackRepository.findByEventId(eventId));
    }

    private String uniqueInviteCode() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (int attempt = 0; attempt < 50; attempt++) {
            StringBuilder code = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                code.append(alphabet.charAt(random.nextInt(alphabet.length())));
            }
            if (!teamRepository.existsByInviteCode(code.toString())) {
                return code.toString();
            }
        }
        throw new IllegalStateException("Could not generate a unique invite code for the demo teams");
    }

    private void log(Event event, DemoStage stage, int teams) {
        auditLogService.log("DEMO_DATA_SEEDED", "event", event.getId(),
                stage + " with " + teams + " teams");
    }
}
