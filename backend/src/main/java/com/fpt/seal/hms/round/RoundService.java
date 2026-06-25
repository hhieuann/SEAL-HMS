package com.fpt.seal.hms.round;

import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.round.dto.RoundRequest;
import com.fpt.seal.hms.round.dto.RoundResponse;
import com.fpt.seal.hms.round.dto.RoundStatusUpdateRequest;
import com.fpt.seal.hms.round.entity.Round;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;

    @Transactional(readOnly = true)
    public List<RoundResponse> getRoundsByEventId(Long eventId) {
        return roundRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoundResponse getRoundById(Long id) {
        Round round = findRoundEntityById(id);
        return mapToResponse(round);
    }

    @Transactional
    public RoundResponse createRound(Long eventId, RoundRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        int nextSeq = roundRepository.findMaxRoundSeqByEventId(event.getId()).orElse(0) + 1;

        Round round = new Round();
        round.setEvent(event);
        round.setName(request.getName());
        round.setStartTime(request.getStartTime());
        round.setEndTime(request.getEndTime());
        round.setPromotionTopN(request.getPromotionTopN());
        round.setEliminatedTeams(request.getEliminatedTeams());
        round.setStatus(RoundStatus.CREATED);
        round.setRoundSeq(nextSeq);

        return mapToResponse(roundRepository.save(round));
    }

    @Transactional
    public RoundResponse updateRound(Long id, RoundRequest request) {
        Round round = findRoundEntityById(id);

        if (round.getStatus() != RoundStatus.CREATED) {
            throw new BusinessException("Cannot update round details after it has started (Status is not CREATED)");
        }

        // We don't allow moving a round to another event, so ignore request.getEventId() here
        round.setName(request.getName());
        round.setStartTime(request.getStartTime());
        round.setEndTime(request.getEndTime());
        round.setPromotionTopN(request.getPromotionTopN());
        round.setEliminatedTeams(request.getEliminatedTeams());

        return mapToResponse(roundRepository.save(round));
    }

    @Transactional
    public RoundResponse updateRoundStatus(Long id, RoundStatus newStatus) {
        Round round = findRoundEntityById(id);
        RoundStatus currentStatus = round.getStatus();

        if (currentStatus == newStatus) {
            return mapToResponse(round);
        }

        validateOneWayStatusTransition(currentStatus, newStatus);
        
        round.setStatus(newStatus);
        return mapToResponse(roundRepository.save(round));
    }

    @Transactional
    public void deleteRound(Long id) {
        Round round = findRoundEntityById(id);

        if (round.getStatus() != RoundStatus.CREATED) {
            throw new BusinessException("Cannot delete round after it has started (Status is not CREATED)");
        }

        roundRepository.delete(round);
    }

    private void validateOneWayStatusTransition(RoundStatus current, RoundStatus next) {
        boolean isValid = false;
        switch (current) {
            case CREATED:
                isValid = (next == RoundStatus.ACTIVE);
                break;
            case ACTIVE:
                isValid = (next == RoundStatus.SCORING);
                break;
            case SCORING:
                isValid = (next == RoundStatus.UNDER_REVIEW);
                break;
            case UNDER_REVIEW:
                isValid = (next == RoundStatus.COMPLETED);
                break;
            case COMPLETED:
                // Cannot transition out
                isValid = false;
                break;
        }

        if (!isValid) {
            throw new BusinessException(String.format("Strict one-way transition violated: Cannot change from %s to %s", current, next));
        }
    }

    private Round findRoundEntityById(Long id) {
        return roundRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Round not found with id: " + id));
    }

    private RoundResponse mapToResponse(Round round) {
        RoundResponse response = new RoundResponse();
        response.setId(round.getId());
        response.setEventId(round.getEvent().getId());
        response.setName(round.getName());
        response.setStartTime(round.getStartTime());
        response.setEndTime(round.getEndTime());
        response.setPromotionTopN(round.getPromotionTopN());
        response.setEliminatedTeams(round.getEliminatedTeams());
        response.setStatus(round.getStatus());
        response.setRoundSeq(round.getRoundSeq());
        response.setCreatedAt(round.getCreatedAt());
        response.setUpdatedAt(round.getUpdatedAt());
        return response;
    }
}
