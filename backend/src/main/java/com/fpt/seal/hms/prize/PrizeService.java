package com.fpt.seal.hms.prize;

import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.prize.dto.PrizeRequest;
import com.fpt.seal.hms.prize.dto.PrizeResponse;
import com.fpt.seal.hms.prize.entity.Prize;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Prizes for an event. A prize can carry a target rank (1st, 2nd, ...); awardByRanking
 * then assigns each ranked prize to the team holding that Team.eventRank (set by
 * RankingService.computeEventRanking). Prizes without a rank are awarded manually.
 */
@Service
@RequiredArgsConstructor
public class PrizeService {

    private final PrizeRepository prizeRepository;
    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;

    @Transactional
    public PrizeResponse createPrize(Long eventId, PrizeRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        Prize prize = new Prize();
        prize.setEvent(event);
        prize.setName(request.name());
        prize.setRank(request.rank());
        prize.setValue(request.value());
        prize.setPrizeType(request.prizeType());
        return toResponse(prizeRepository.save(prize));
    }

    @Transactional(readOnly = true)
    public List<PrizeResponse> getPrizesByEvent(Long eventId) {
        return prizeRepository.findByEventIdOrderByRankAsc(eventId).stream()
                .map(this::toResponse).toList();
    }

    /** Assign each ranked prize to the team at that event rank. Run after event ranking. */
    @Transactional
    public List<PrizeResponse> awardByRanking(Long eventId) {
        Map<Integer, Team> teamByRank = teamRepository.findByEventId(eventId).stream()
                .filter(t -> t.getEventRank() != null)
                .collect(Collectors.toMap(Team::getEventRank, t -> t, (a, b) -> a));

        List<Prize> prizes = prizeRepository.findByEventIdOrderByRankAsc(eventId);
        for (Prize prize : prizes) {
            if (prize.getRank() != null) {
                prize.setTeam(teamByRank.get(prize.getRank())); // null if no team holds that rank yet
            }
        }
        prizeRepository.saveAll(prizes);
        return prizes.stream().map(this::toResponse).toList();
    }

    /** Award a single prize to a specific team (manual override / unranked prizes). */
    @Transactional
    public PrizeResponse awardPrize(Long prizeId, Long teamId) {
        Prize prize = prizeRepository.findById(prizeId)
                .orElseThrow(() -> new ResourceNotFoundException("Prize not found: " + prizeId));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));
        prize.setTeam(team);
        return toResponse(prizeRepository.save(prize));
    }

    @Transactional
    public void deletePrize(Long prizeId) {
        if (!prizeRepository.existsById(prizeId)) {
            throw new ResourceNotFoundException("Prize not found: " + prizeId);
        }
        prizeRepository.deleteById(prizeId);
    }

    private PrizeResponse toResponse(Prize prize) {
        Team team = prize.getTeam();
        return new PrizeResponse(
                prize.getId(),
                prize.getEvent().getId(),
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                prize.getName(),
                prize.getRank(),
                prize.getValue(),
                prize.getPrizeType());
    }
}
