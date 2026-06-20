package com.fpt.seal.hms.config;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.enums.MemberRole;
import com.fpt.seal.hms.common.enums.MemberStatus;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.round.RoundRepository;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/debug")
@RequiredArgsConstructor
public class DebugController {

    private final JdbcTemplate jdbcTemplate;
    private final AccountRepository accountRepository;
    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final TrackRepository trackRepository;
    private final TopicRepository topicRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeeder adminSeeder;

    @GetMapping("/reset-and-seed")
    @Transactional
    public ResponseEntity<String> resetAndSeed() {
        // 1. Truncate all tables
        jdbcTemplate.execute("TRUNCATE TABLE account, event, round, track, topic, team, team_member, submission, score, criterion, round_ranking RESTART IDENTITY CASCADE;");
        
        // 2. Re-seed Admin & Staff
        adminSeeder.run();

        // 3. Seed Students (6 students)
        List<Account> students = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            Account student = new Account();
            student.setEmail("student" + i + "@seal-hms.local");
            student.setPassword(passwordEncoder.encode("Student@123"));
            student.setRole(Role.STUDENT);
            student.setStatus(AccountStatus.ACTIVE);
            students.add(accountRepository.save(student));
        }

        // 4. Seed Judges (2 judges)
        for (int i = 1; i <= 2; i++) {
            Account judge = new Account();
            judge.setEmail("judge" + i + "@seal-hms.local");
            judge.setPassword(passwordEncoder.encode("Judge@123"));
            judge.setRole(Role.GUEST_JUDGE);
            judge.setStatus(AccountStatus.ACTIVE);
            accountRepository.save(judge);
        }

        // 5. Seed Event
        Event event = new Event();
        event.setName("SEAL Hackathon Spring 2026");
        event.setType("Hackathon");
        event.setStartDate(LocalDate.now());
        event.setEndDate(LocalDate.now().plusDays(3));
        event.setDescription("Main Hackathon Event for SE Students");
        event.setStatus(EventStatus.PLANNED);
        event = eventRepository.save(event);

        // 6. Seed Rounds
        Round r1 = new Round();
        r1.setEvent(event);
        r1.setName("Qualifying Round");
        r1.setRoundSeq(1);
        r1.setStartTime(LocalDateTime.now());
        r1.setEndTime(LocalDateTime.now().plusDays(1));
        r1.setStatus(RoundStatus.CREATED);
        roundRepository.save(r1);

        Round r2 = new Round();
        r2.setEvent(event);
        r2.setName("Final Round");
        r2.setRoundSeq(2);
        r2.setStartTime(LocalDateTime.now().plusDays(2));
        r2.setEndTime(LocalDateTime.now().plusDays(3));
        r2.setStatus(RoundStatus.CREATED);
        roundRepository.save(r2);

        // 7. Seed Tracks & Topics
        Track track = new Track();
        track.setEvent(event);
        track.setName("General Track");
        track.setDescription("Default track");
        track = trackRepository.save(track);

        Topic t1 = new Topic();
        t1.setTrack(track);
        t1.setName("AI in Healthcare");
        t1.setDescription("Build an AI system for healthcare.");
        topicRepository.save(t1);

        Topic t2 = new Topic();
        t2.setTrack(track);
        t2.setName("Web3 Finance");
        t2.setDescription("Decentralized finance platform.");
        topicRepository.save(t2);

        // 8. Seed Teams (2 Teams, 3 members each)
        // Team 1
        Team team1 = new Team();
        team1.setName("Alpha Team");
        team1.setEvent(event);
        team1.setStatus(TeamStatus.REGISTERED);
        team1 = teamRepository.save(team1);

        createTeamMember(team1, students.get(0), MemberRole.LEADER);
        createTeamMember(team1, students.get(1), MemberRole.MEMBER);
        createTeamMember(team1, students.get(2), MemberRole.MEMBER);

        // Team 2
        Team team2 = new Team();
        team2.setName("Beta Team");
        team2.setEvent(event);
        team2.setStatus(TeamStatus.REGISTERED);
        team2 = teamRepository.save(team2);

        createTeamMember(team2, students.get(3), MemberRole.LEADER);
        createTeamMember(team2, students.get(4), MemberRole.MEMBER);
        createTeamMember(team2, students.get(5), MemberRole.MEMBER);

        return ResponseEntity.ok("Database has been completely cleared and seeded with: " +
                "1 Event, 2 Rounds, 2 Topics, 6 Students (student1 to student6), 2 Judges (judge1, judge2), and 2 full Teams (Alpha, Beta). " +
                "Password for all test accounts is 'Student@123' or 'Judge@123' or 'Admin@12345'.");
    }

    private void createTeamMember(Team team, Account account, MemberRole role) {
        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setAccount(account);
        member.setRole(role);
        member.setStatus(MemberStatus.ACCEPTED);
        teamMemberRepository.save(member);
    }
}
