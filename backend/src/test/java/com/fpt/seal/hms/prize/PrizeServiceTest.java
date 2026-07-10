package com.fpt.seal.hms.prize;

import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.prize.dto.PrizeRequest;
import com.fpt.seal.hms.prize.dto.PrizeResponse;
import com.fpt.seal.hms.prize.entity.Prize;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrizeServiceTest {

    @Mock
    private PrizeRepository prizeRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private com.fpt.seal.hms.auditlog.AuditLogService auditLogService;
    @InjectMocks
    private PrizeService prizeService;

    private Event event(long id) {
        Event e = new Event();
        e.setId(id);
        e.setName("Event " + id);
        return e;
    }

    private Team team(long id, String name, Integer eventRank) {
        Team t = new Team();
        t.setId(id);
        t.setName(name);
        t.setEventRank(eventRank);
        return t;
    }

    private Prize prize(long id, Event e, String name, Integer rank) {
        Prize p = new Prize();
        p.setId(id);
        p.setEvent(e);
        p.setName(name);
        p.setRank(rank);
        return p;
    }

    @Test
    void createPrize_persistsAllFields() {
        Event e = event(1L);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(prizeRepository.save(any(Prize.class))).thenAnswer(inv -> inv.getArgument(0));

        PrizeResponse res = prizeService.createPrize(1L,
                new PrizeRequest("Champion", 1, new BigDecimal("1000"), "CASH"));

        assertThat(res.name()).isEqualTo("Champion");
        assertThat(res.rank()).isEqualTo(1);
        assertThat(res.eventId()).isEqualTo(1L);
        assertThat(res.teamId()).isNull(); // not awarded yet
    }

    @Test
    void createPrize_throws_whenEventMissing() {
        when(eventRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> prizeService.createPrize(9L,
                new PrizeRequest("X", 1, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(prizeRepository, never()).save(any());
    }

    @Test
    void awardByRanking_assignsEachRankedPrizeToTeamAtThatRank() {
        Event e = event(1L);
        Prize p1 = prize(11L, e, "Champion", 1);
        Prize p2 = prize(12L, e, "Runner-up", 2);
        when(prizeRepository.findByEventIdOrderByRankAsc(1L)).thenReturn(List.of(p1, p2));
        when(teamRepository.findByEventId(1L)).thenReturn(List.of(
                team(1L, "A", 2), team(2L, "B", 1), team(3L, "C", 3)));

        List<PrizeResponse> out = prizeService.awardByRanking(1L);

        assertThat(out).extracting(PrizeResponse::name, PrizeResponse::teamName)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Champion", "B"),
                        org.assertj.core.groups.Tuple.tuple("Runner-up", "A"));
        verify(prizeRepository).saveAll(anyList());
    }

    @Test
    void awardByRanking_leavesPrizeUnassigned_whenNoTeamHoldsThatRank() {
        Event e = event(1L);
        Prize p3 = prize(13L, e, "Third", 3);
        when(prizeRepository.findByEventIdOrderByRankAsc(1L)).thenReturn(List.of(p3));
        when(teamRepository.findByEventId(1L)).thenReturn(List.of(team(1L, "A", 1)));

        List<PrizeResponse> out = prizeService.awardByRanking(1L);

        assertThat(out.get(0).teamId()).isNull();
    }

    @Test
    void awardByRanking_ignoresTeamsWithoutEventRank() {
        Event e = event(1L);
        Prize p1 = prize(11L, e, "Champion", 1);
        when(prizeRepository.findByEventIdOrderByRankAsc(1L)).thenReturn(List.of(p1));
        when(teamRepository.findByEventId(1L)).thenReturn(List.of(
                team(1L, "NoRank", null), team(2L, "B", 1)));

        List<PrizeResponse> out = prizeService.awardByRanking(1L);

        assertThat(out.get(0).teamName()).isEqualTo("B");
    }

    @Test
    void awardPrize_manualAssignment() {
        Event e = event(1L);
        Prize p = prize(11L, e, "Special", null);
        when(prizeRepository.findById(11L)).thenReturn(Optional.of(p));
        when(teamRepository.findById(3L)).thenReturn(Optional.of(team(3L, "C", null)));
        when(prizeRepository.save(any(Prize.class))).thenAnswer(inv -> inv.getArgument(0));

        PrizeResponse res = prizeService.awardPrize(11L, 3L);

        assertThat(res.teamName()).isEqualTo("C");
    }

    @Test
    void awardPrize_throws_whenPrizeMissing() {
        when(prizeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> prizeService.awardPrize(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deletePrize_throws_whenMissing() {
        when(prizeRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> prizeService.deletePrize(99L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(prizeRepository, never()).deleteById(any());
    }
}
