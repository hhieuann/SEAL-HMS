package com.fpt.seal.hms.team;

import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.chapter.ChapterRepository;
import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.topic.TopicRepository;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Review 15/07: balanced track draw + per-track capacity enforcement. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamTrackAssignmentTest {

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

    private Event ongoingEvent(long id) {
        Event e = new Event();
        e.setId(id);
        e.setStatus(EventStatus.ONGOING); // registration locked -> assignment allowed
        return e;
    }

    private Track track(long id, String name, Integer maxTeams) {
        Track t = new Track();
        t.setId(id);
        t.setName(name);
        t.setMaxTeams(maxTeams);
        return t;
    }

    private Team registeredTeam(long id, Event event) {
        Team t = new Team();
        t.setId(id);
        t.setName("Team " + id);
        t.setEvent(event);
        t.setStatus(TeamStatus.REGISTERED);
        return t;
    }

    private void stubCommon(Team team, List<Track> tracks) {
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(trackRepository.findByEventId(1L)).thenReturn(tracks);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamMemberRepository.findByTeamId(any())).thenReturn(List.of());
        when(topicRepository.findByTrackId(any())).thenReturn(List.of());
    }

    // ---------- happy path: balance ----------

    @Test
    void randomAssign_picksLeastLoadedTrack() {
        Event event = ongoingEvent(1L);
        Team team = registeredTeam(10L, event);
        Track t1 = track(1L, "AI", null), t2 = track(2L, "Web", null), t3 = track(3L, "Data", null);
        stubCommon(team, List.of(t1, t2, t3));
        // current load: AI=3, Web=2, Data=1 -> must go to Data
        when(teamRepository.countByTrackId(1L)).thenReturn(3L);
        when(teamRepository.countByTrackId(2L)).thenReturn(2L);
        when(teamRepository.countByTrackId(3L)).thenReturn(1L);

        teamService.assignRandomTrackAndTopic(10L, 1L);

        assertThat(team.getTrack().getName()).isEqualTo("Data");
    }

    @Test
    void randomAssign_sevenTeamsOverThreeTracks_spreadNeverDiffersByMoreThanOne() {
        // Simulate the lecturer's example: 7 teams drawn one by one into 3 empty tracks.
        Event event = ongoingEvent(1L);
        Track t1 = track(1L, "A", null), t2 = track(2L, "B", null), t3 = track(3L, "C", null);
        long[] load = new long[]{0, 0, 0};
        when(teamRepository.countByTrackId(1L)).thenAnswer(inv -> load[0]);
        when(teamRepository.countByTrackId(2L)).thenAnswer(inv -> load[1]);
        when(teamRepository.countByTrackId(3L)).thenAnswer(inv -> load[2]);
        when(trackRepository.findByEventId(1L)).thenReturn(List.of(t1, t2, t3));
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamMemberRepository.findByTeamId(any())).thenReturn(List.of());
        when(topicRepository.findByTrackId(any())).thenReturn(List.of());

        for (long teamId = 1; teamId <= 7; teamId++) {
            Team team = registeredTeam(teamId, event);
            when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
            teamService.assignRandomTrackAndTopic(teamId, 1L);
            load[(int) (team.getTrack().getId() - 1)]++;
        }

        // 7 over 3 -> 3/2/2 in some order; max spread is exactly 1
        long max = Math.max(load[0], Math.max(load[1], load[2]));
        long min = Math.min(load[0], Math.min(load[1], load[2]));
        assertThat(load[0] + load[1] + load[2]).isEqualTo(7);
        assertThat(max - min).isLessThanOrEqualTo(1);
    }

    // ---------- worst cases: capacity ----------

    @Test
    void randomAssign_skipsFullTracks() {
        Event event = ongoingEvent(1L);
        Team team = registeredTeam(10L, event);
        Track full = track(1L, "Full", 2), open = track(2L, "Open", 5);
        stubCommon(team, List.of(full, open));
        when(teamRepository.countByTrackId(1L)).thenReturn(2L); // at max
        when(teamRepository.countByTrackId(2L)).thenReturn(4L);

        teamService.assignRandomTrackAndTopic(10L, 1L);

        assertThat(team.getTrack().getName()).isEqualTo("Open"); // never the full one
    }

    @Test
    void randomAssign_throwsClearError_whenEveryTrackIsFull() {
        Event event = ongoingEvent(1L);
        Team team = registeredTeam(10L, event);
        Track t1 = track(1L, "A", 2), t2 = track(2L, "B", 2);
        stubCommon(team, List.of(t1, t2));
        when(teamRepository.countByTrackId(1L)).thenReturn(2L);
        when(teamRepository.countByTrackId(2L)).thenReturn(2L);

        assertThatThrownBy(() -> teamService.assignRandomTrackAndTopic(10L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("full");
        verify(teamRepository, never()).save(any());
    }

    @Test
    void manualAssign_rejectsFullTrack() {
        Event event = ongoingEvent(1L);
        Team team = registeredTeam(10L, event);
        Track full = track(1L, "Full", 3);
        when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
        when(trackRepository.findById(1L)).thenReturn(Optional.of(full));
        when(teamRepository.countByTrackId(1L)).thenReturn(3L);

        assertThatThrownBy(() -> teamService.assignTrack(10L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("full");
    }

    @Test
    void manualAssign_reassigningSameTrack_doesNotCountItselfAgainstCapacity() {
        Event event = ongoingEvent(1L);
        Team team = registeredTeam(10L, event);
        Track t = track(1L, "A", 3);
        team.setTrack(t); // already on this track, which is at max including itself
        when(teamRepository.findById(10L)).thenReturn(Optional.of(team));
        when(trackRepository.findById(1L)).thenReturn(Optional.of(t));
        when(teamRepository.countByTrackId(1L)).thenReturn(3L);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamMemberRepository.findByTeamId(any())).thenReturn(List.of());

        // must NOT throw: the team itself holds one of the 3 slots
        teamService.assignTrack(10L, 1L);

        assertThat(team.getTrack().getId()).isEqualTo(1L);
    }

    @Test
    void randomAssign_unlimitedTracks_maxTeamsNull_alwaysHaveRoom() {
        Event event = ongoingEvent(1L);
        Team team = registeredTeam(10L, event);
        Track t1 = track(1L, "A", null);
        stubCommon(team, List.of(t1));
        when(teamRepository.countByTrackId(1L)).thenReturn(999L);

        teamService.assignRandomTrackAndTopic(10L, 1L);

        assertThat(team.getTrack()).isNotNull();
    }
}
