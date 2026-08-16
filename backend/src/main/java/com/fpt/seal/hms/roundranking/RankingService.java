package com.fpt.seal.hms.roundranking;

import com.fpt.seal.hms.common.exception.BusinessException;
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
    private final com.fpt.seal.hms.auditlog.AuditLogService auditLogService;

    /**
     * Rank every team in the round by final score and promote the top N. Promotion is decided by
     * the scores, never by picking teams: whoever scored higher goes through.
     *
     * The one case scores cannot settle is a tie that straddles the cut-off — three teams level
     * on points for two remaining places. Rather than promote all of them (breaking the round
     * size) or silently drop one, this refuses to finalise and reports who is tied. A coordinator
     * then re-runs it with {@code tieBreakTeamIds}, which may only name teams from that tied
     * group, plus the reason that gets recorded against them.
     */
    @Transactional
    public List<RoundStandingDto> computeRoundRanking(Long roundId, List<Long> tieBreakTeamIds,
                                                      String tieBreakReason) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round not found: " + roundId));

        List<RoundRanking> rankings = roundRankingRepository.findByRoundId(roundId);
        rankings.sort(Comparator.comparing(this::scoreOf).reversed());
        assignRanks(rankings, this::scoreOf, RoundRanking::setRank);

        Integer topN = round.getPromotionTopN();
        boolean promotes = topN != null && topN > 0 && topN < rankings.size();

        if (!promotes) {
            // Final round, or every team continues: nobody is filtered out.
            for (RoundRanking rr : rankings) {
                rr.setIsPromoted(topN != null && topN > 0 && rr.getRank() != null && rr.getRank() <= topN);
            }
            roundRankingRepository.saveAll(rankings);
            auditLogService.log("ROUND_RANKING_COMPUTED", "round", roundId, "top-N: " + topN);
            return rankings.stream().map(this::toRoundDto).toList();
        }

        // Teams that are clear of the cut-off, and the tied group sitting on it.
        List<RoundRanking> clear = new ArrayList<>();
        List<RoundRanking> onTheLine = new ArrayList<>();
        BigDecimal cutoffScore = scoreOf(rankings.get(topN - 1));
        for (RoundRanking rr : rankings) {
            int cmp = scoreOf(rr).compareTo(cutoffScore);
            if (cmp > 0) {
                clear.add(rr);
            } else if (cmp == 0) {
                onTheLine.add(rr);
            }
        }

        int slotsLeft = topN - clear.size();
        java.util.Set<Long> promotedIds = new java.util.HashSet<>();
        clear.forEach(rr -> promotedIds.add(rr.getTeam().getId()));
        String auditNote = "top-" + topN;

        if (onTheLine.size() > slotsLeft) {
            java.util.Set<Long> chosen = normaliseIds(tieBreakTeamIds);
            java.util.Set<Long> tiedIds = new java.util.HashSet<>();
            onTheLine.forEach(rr -> tiedIds.add(rr.getTeam().getId()));

            if (chosen.isEmpty()) {
                throw new BusinessException(tieMessage(onTheLine, slotsLeft, cutoffScore));
            }
            if (!tiedIds.containsAll(chosen)) {
                throw new BusinessException(
                        "A tie-break may only choose between the teams that are actually tied on "
                        + cutoffScore + " points.");
            }
            if (chosen.size() != slotsLeft) {
                throw new BusinessException("There " + (slotsLeft == 1 ? "is 1 place" : "are " + slotsLeft + " places")
                        + " left, so the tie-break must name exactly " + slotsLeft + " team"
                        + (slotsLeft == 1 ? "" : "s") + ".");
            }
            if (tieBreakReason == null || tieBreakReason.isBlank()) {
                throw new BusinessException("Breaking a tie needs a reason — it decides who leaves the event.");
            }
            promotedIds.addAll(chosen);
            onTheLine.forEach(rr -> rr.setTieBreakReason(tieBreakReason));
            auditNote += ", tie on " + cutoffScore + " broken for " + chosen + ": " + tieBreakReason;
        } else {
            onTheLine.forEach(rr -> promotedIds.add(rr.getTeam().getId()));
        }

        for (RoundRanking rr : rankings) {
            rr.setIsPromoted(promotedIds.contains(rr.getTeam().getId()));
        }
        roundRankingRepository.saveAll(rankings);
        auditLogService.log("ROUND_RANKING_COMPUTED", "round", roundId, auditNote);
        return rankings.stream().map(this::toRoundDto).toList();
    }

    private String tieMessage(List<RoundRanking> tied, int slotsLeft, BigDecimal score) {
        String names = tied.stream().map(rr -> rr.getTeam().getName()).sorted()
                .collect(java.util.stream.Collectors.joining(", "));
        return tied.size() + " teams are tied on " + score + " points for "
                + (slotsLeft == 1 ? "the last place" : "the last " + slotsLeft + " places")
                + ": " + names + ". Decide which " + slotsLeft + " go through and give a reason.";
    }

    /**
     * Jackson may deserialise small JSON numbers as Integer while Team.getId() is Long, and
     * Integer.equals(Long) is always false — so normalise through Number::longValue.
     */
    private java.util.Set<Long> normaliseIds(List<Long> ids) {
        java.util.Set<Long> out = new java.util.HashSet<>();
        if (ids != null) {
            for (Object raw : (List<?>) (Object) ids) {
                if (raw != null) out.add(((Number) raw).longValue());
            }
        }
        return out;
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
        auditLogService.log("EVENT_RANKING_COMPUTED", "event", eventId, teams.size() + " teams ranked");
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
                rr.getRawScore(), rr.getScore(), rr.getRank(), rr.getIsPromoted(),
                rr.getPenaltyPoints(), rr.getPenaltyReason(),
                rr.getBonusPoints(), rr.getBonusReason(), rr.getTieBreakReason());
    }

    private EventStandingDto toEventDto(Team t) {
        return new EventStandingDto(t.getId(), t.getName(), t.getEventScore(), t.getEventRank());
    }
}
