package com.fpt.seal.hms.roundranking;

import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.roundranking.dto.EventStandingDto;
import com.fpt.seal.hms.roundranking.dto.RoundStandingDto;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.round.RoundRepository;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RankingServiceTest {

    @Mock
    private RoundRankingRepository roundRankingRepository;
    @Mock
    private RoundRepository roundRepository;
    @Mock
    private TeamRepository teamRepository;
    @InjectMocks
    private RankingService rankingService;

    private Team team(long id, String name) {
        Team t = new Team();
        t.setId(id);
        t.setName(name);
        return t;
    }

    private RoundRanking rr(long id, Team team, Round round, String score) {
        RoundRanking r = new RoundRanking();
        r.setId(id);
        r.setTeam(team);
        r.setRound(round);
        r.setScore(score == null ? null : new BigDecimal(score));
        return r;
    }

    private Round round(long id, Integer topN) {
        Round r = new Round();
        r.setId(id);
        r.setPromotionTopN(topN);
        return r;
    }

    // ---------- computeRoundRanking ----------

    @Test
    void computeRoundRanking_ranksByScoreDesc_andPromotesTopN() {
        Round round = round(1L, 2);
        Team a = team(1L, "A"), b = team(2L, "B"), c = team(3L, "C");
        List<RoundRanking> list = new ArrayList<>(List.of(
                rr(11L, a, round, "60"), rr(12L, b, round, "90"), rr(13L, c, round, "75")));
        when(roundRepository.findById(1L)).thenReturn(Optional.of(round));
        when(roundRankingRepository.findByRoundId(1L)).thenReturn(list);

        List<RoundStandingDto> out = rankingService.computeRoundRanking(1L, null);

        assertThat(out).extracting(RoundStandingDto::teamName).containsExactly("B", "C", "A");
        assertThat(out).extracting(RoundStandingDto::rank).containsExactly(1, 2, 3);
        assertThat(out).extracting(RoundStandingDto::promoted).containsExactly(true, true, false);
        verify(roundRankingRepository).saveAll(anyList());
    }

    @Test
    void computeRoundRanking_tiedScores_shareRank_competitionStyle() {
        Round round = round(1L, 1);
        List<RoundRanking> list = new ArrayList<>(List.of(
                rr(11L, team(1L, "A"), round, "90"),
                rr(12L, team(2L, "B"), round, "90"),
                rr(13L, team(3L, "C"), round, "60")));
        when(roundRepository.findById(1L)).thenReturn(Optional.of(round));
        when(roundRankingRepository.findByRoundId(1L)).thenReturn(list);

        List<RoundStandingDto> out = rankingService.computeRoundRanking(1L, null);

        // "1224": two teams at 90 share rank 1, next distinct score lands at rank 3
        assertThat(out).extracting(RoundStandingDto::rank).containsExactly(1, 1, 3);
    }

    @Test
    void computeRoundRanking_promotedTeamIds_overridesTopN() {
        Round round = round(1L, 2); // topN says 2, but explicit list promotes only team C
        Team a = team(1L, "A"), b = team(2L, "B"), c = team(3L, "C");
        List<RoundRanking> list = new ArrayList<>(List.of(
                rr(11L, a, round, "90"), rr(12L, b, round, "75"), rr(13L, c, round, "60")));
        when(roundRepository.findById(1L)).thenReturn(Optional.of(round));
        when(roundRankingRepository.findByRoundId(1L)).thenReturn(list);

        List<RoundStandingDto> out = rankingService.computeRoundRanking(1L, List.of(3L));

        assertThat(out).extracting(RoundStandingDto::teamId, RoundStandingDto::promoted)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(1L, false),
                        org.assertj.core.groups.Tuple.tuple(2L, false),
                        org.assertj.core.groups.Tuple.tuple(3L, true));
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void computeRoundRanking_promotedTeamIds_acceptsIntegersFromJson() {
        // Jackson can deserialize small JSON numbers as Integer inside the List
        Round round = round(1L, null);
        List<RoundRanking> list = new ArrayList<>(List.of(rr(11L, team(2L, "B"), round, "80")));
        when(roundRepository.findById(1L)).thenReturn(Optional.of(round));
        when(roundRankingRepository.findByRoundId(1L)).thenReturn(list);

        List rawIds = List.of(Integer.valueOf(2)); // Integer, not Long
        List<RoundStandingDto> out = rankingService.computeRoundRanking(1L, (List<Long>) rawIds);

        assertThat(out.get(0).promoted()).isTrue();
    }

    @Test
    void computeRoundRanking_nullScores_countAsZero() {
        Round round = round(1L, 1);
        List<RoundRanking> list = new ArrayList<>(List.of(
                rr(11L, team(1L, "A"), round, null), rr(12L, team(2L, "B"), round, "10")));
        when(roundRepository.findById(1L)).thenReturn(Optional.of(round));
        when(roundRankingRepository.findByRoundId(1L)).thenReturn(list);

        List<RoundStandingDto> out = rankingService.computeRoundRanking(1L, null);

        assertThat(out.get(0).teamName()).isEqualTo("B");
        assertThat(out.get(1).rank()).isEqualTo(2);
    }

    @Test
    void computeRoundRanking_throws_whenRoundMissing() {
        when(roundRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rankingService.computeRoundRanking(99L, null))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(roundRankingRepository, never()).saveAll(any());
    }

    // ---------- computeEventRanking ----------

    @Test
    void computeEventRanking_sumsAcrossRounds_andRanksTeams() {
        Team a = team(1L, "A"), b = team(2L, "B");
        Round r1 = round(1L, null), r2 = round(2L, null);
        when(roundRankingRepository.findByRound_Event_Id(5L)).thenReturn(List.of(
                rr(11L, a, r1, "40"), rr(12L, b, r1, "50"),
                rr(13L, a, r2, "45"), rr(14L, b, r2, "30")));

        List<EventStandingDto> out = rankingService.computeEventRanking(5L);

        // A: 40+45=85, B: 50+30=80
        assertThat(out).extracting(EventStandingDto::teamName).containsExactly("A", "B");
        assertThat(out.get(0).eventScore()).isEqualByComparingTo("85");
        assertThat(out.get(0).eventRank()).isEqualTo(1);
        assertThat(out.get(1).eventRank()).isEqualTo(2);
        verify(teamRepository).saveAll(anyList());
    }

    @Test
    void computeEventRanking_emptyEvent_returnsEmpty() {
        when(roundRankingRepository.findByRound_Event_Id(9L)).thenReturn(List.of());

        assertThat(rankingService.computeEventRanking(9L)).isEmpty();
    }

    // ---------- read paths ----------

    @Test
    void getRoundStandings_ordersByRank_nullsLast() {
        Round round = round(1L, null);
        RoundRanking withRank = rr(11L, team(1L, "A"), round, "50");
        withRank.setRank(1);
        RoundRanking noRank = rr(12L, team(2L, "B"), round, "40");
        when(roundRankingRepository.findByRoundId(1L)).thenReturn(new ArrayList<>(List.of(noRank, withRank)));

        List<RoundStandingDto> out = rankingService.getRoundStandings(1L);

        assertThat(out).extracting(RoundStandingDto::teamName).containsExactly("A", "B");
    }
}
