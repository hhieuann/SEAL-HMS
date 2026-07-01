package com.fpt.seal.hms.roundranking;

import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.roundranking.dto.EventStandingDto;
import com.fpt.seal.hms.roundranking.dto.RoundStandingDto;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.round.RoundRepository;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Turns per-submission scores into rankings. RoundRanking is the source of truth:
 * computeRoundRanking ranks teams within a round and flags the top-N for promotion;
 * computeEventRanking aggregates every round of an event into Team.eventScore/eventRank.
 * Derived values (rank, isPromoted, eventScore, eventRank) are only ever set here.
 */
@Service
@RequiredArgsConstructor
public class RankingService {

    private final RoundRankingRepository roundRankingRepository;
    private final RoundRepository roundRepository;
    private final TeamRepository teamRepository;

    /** Rank every team in the round by score (desc) and mark the top-N as promoted. */
    @Transactional
    public List<RoundStandingDto> computeRoundRanking(Long roundId, List<Long> promotedTeamIds) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round not found: " + roundId));

        List<RoundRanking> rankings = roundRankingRepository.findByRoundId(roundId);
        rankings.sort(Comparator.comparing(this::scoreOf).reversed());

        Integer topN = round.getPromotionTopN();

        assignRanks(rankings, this::scoreOf, RoundRanking::setRank);
        for (RoundRanking rr : rankings) {
            Integer rank = rr.getRank();
            if (promotedTeamIds != null && !promotedTeamIds.isEmpty()) {
                rr.setIsPromoted(promotedTeamIds.contains(rr.getTeam().getId()));
            } else {
                rr.setIsPromoted(topN != null && topN > 0 && rank != null && rank <= topN);
            }
        }
        roundRankingRepository.saveAll(rankings);
        return rankings.stream().map(this::toRoundDto).toList();
    }

    /** Read the current round standings (already-computed ranks), ordered by rank. */
    @Transactional(readOnly = true)
    public List<RoundStandingDto> getRoundStandings(Long roundId) {
        List<RoundRanking> rankings = roundRankingRepository.findByRoundId(roundId);
        rankings.sort(Comparator.comparing(rr -> rr.getRank() == null ? Integer.MAX_VALUE : rr.getRank()));
        return rankings.stream().map(this::toRoundDto).toList();
    }

    /** Aggregate a team's scores across all rounds of the event into eventScore/eventRank. */
    @Transactional
    public List<EventStandingDto> computeEventRanking(Long eventId) {
        List<RoundRanking> all = roundRankingRepository.findByRound_Event_Id(eventId);

        Map<Long, Team> teamById = new LinkedHashMap<>();
        Map<Long, BigDecimal> totalByTeam = new LinkedHashMap<>();
        for (RoundRanking rr : all) {
            Team team = rr.getTeam();
            teamById.putIfAbsent(team.getId(), team);
            totalByTeam.merge(team.getId(), scoreOf(rr), BigDecimal::add);
        }

        List<Team> teams = new ArrayList<>(teamById.values());
        teams.sort(Comparator.comparing((Team t) -> totalByTeam.get(t.getId())).reversed());
        assignRanks(teams, t -> totalByTeam.get(t.getId()), Team::setEventRank);
        for (Team t : teams) {
            t.setEventScore(totalByTeam.get(t.getId()));
        }
        teamRepository.saveAll(teams);
        return teams.stream().map(this::toEventDto).toList();
    }

    /** Read event standings (already-computed), ordered by eventRank. */
    @Transactional(readOnly = true)
    public List<EventStandingDto> getEventStandings(Long eventId) {
        Map<Long, Team> teamById = new LinkedHashMap<>();
        for (RoundRanking rr : roundRankingRepository.findByRound_Event_Id(eventId)) {
            teamById.putIfAbsent(rr.getTeam().getId(), rr.getTeam());
        }
        return teamById.values().stream()
                .sorted(Comparator.comparing(t -> t.getEventRank() == null ? Integer.MAX_VALUE : t.getEventRank()))
                .map(this::toEventDto)
                .toList();
    }

    /**
     * Standard competition ranking ("1224"): same value → same rank, next distinct
     * value jumps to its position. Items must already be sorted by value descending.
     */
    private <T> void assignRanks(List<T> items, java.util.function.Function<T, BigDecimal> valueOf,
                                 java.util.function.BiConsumer<T, Integer> setRank) {
        int position = 0;
        int rank = 0;
        BigDecimal previous = null;
        for (T item : items) {
            position++;
            BigDecimal value = valueOf.apply(item);
            if (value == null) value = BigDecimal.ZERO;
            if (previous == null || value.compareTo(previous) != 0) {
                rank = position;
                previous = value;
            }
            setRank.accept(item, rank);
        }
    }

    private BigDecimal scoreOf(RoundRanking rr) {
        return rr.getScore() != null ? rr.getScore() : BigDecimal.ZERO;
    }

    private RoundStandingDto toRoundDto(RoundRanking rr) {
        return new RoundStandingDto(rr.getId(), rr.getTeam().getId(), rr.getTeam().getName(),
                rr.getScore(), rr.getRank(), rr.getIsPromoted());
    }

    private EventStandingDto toEventDto(Team t) {
        return new EventStandingDto(t.getId(), t.getName(), t.getEventScore(), t.getEventRank());
    }
}
