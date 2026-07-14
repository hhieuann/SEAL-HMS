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
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.topic.entity.Topic;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final TopicRepository topicRepository;

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
        round.setDurationHours(request.getDurationHours());
        round.setPromotionTopN(request.getPromotionTopN());
        round.setStatus(RoundStatus.CREATED);
        round.setRoundSeq(nextSeq);

        validateRoundTime(round);
        Round savedRound = roundRepository.save(round);
        validateSequentialPromotionTopN(event);
        return mapToResponse(savedRound);
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
        round.setDurationHours(request.getDurationHours());
        round.setPromotionTopN(request.getPromotionTopN());

        validateRoundTime(round);
        Round savedRound = roundRepository.save(round);
        validateSequentialPromotionTopN(round.getEvent());
        return mapToResponse(savedRound);
    }

    @Transactional
    public RoundResponse updateRoundStatus(Long id, RoundStatus newStatus) {
        Round round = findRoundEntityById(id);
        RoundStatus currentStatus = round.getStatus();

        if (currentStatus == newStatus) {
            return mapToResponse(round);
        }

        validateOneWayStatusTransition(currentStatus, newStatus);
        
        if (newStatus == RoundStatus.ACTIVE && currentStatus == RoundStatus.CREATED) {
            round.setStartTime(java.time.LocalDateTime.now());
        }

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

    public void validateSequentialPromotionTopN(Event event) {
        List<Round> rounds = roundRepository.findByEventId(event.getId());
        rounds.sort(Comparator.comparing(Round::getRoundSeq));

        int trackCount = 1;
        List<Track> tracks = trackRepository.findByEventId(event.getId());
        if (!tracks.isEmpty()) {
            Track firstTrack = tracks.get(0);
            List<Topic> topics = topicRepository.findByTrackId(firstTrack.getId());
            if (!topics.isEmpty()) {
                trackCount = topics.size();
            }
        }

        int availablePool = event.getMaxTeams() != null ? event.getMaxTeams() : 0;

        for (int i = 0; i < rounds.size() - 1; i++) {
            Round round = rounds.get(i);
            int promotionPerTrack = round.getPromotionTopN() != null ? round.getPromotionTopN() : 0;
            int totalPromotedThisRound = promotionPerTrack * trackCount;
            
            if (totalPromotedThisRound >= availablePool) {
                throw new BusinessException(String.format("Round %d promotes %d teams total (%d per track) but the available pool is only %d",
                        round.getRoundSeq(), totalPromotedThisRound, promotionPerTrack, availablePool));
            }
            availablePool = totalPromotedThisRound;
        }

        if (!rounds.isEmpty() && availablePool < 1) {
            throw new BusinessException("Total eliminated teams across rounds is too high. At least 1 team must reach the final round.");
        }
    }

    private void validateRoundTime(Round round) {
        Event event = round.getEvent();
        if (event.getStartDate() != null && round.getStartTime().toLocalDate().isBefore(event.getStartDate())) {
            throw new BusinessException("Round start time cannot be before event start date.");
        }
        if (event.getEndDate() != null) {
            java.time.LocalDateTime roundEndTime = round.getStartTime().plusMinutes((long)(round.getDurationHours() * 60));
            if (roundEndTime.toLocalDate().isAfter(event.getEndDate())) {
                throw new BusinessException("Round end time cannot be after event end date.");
            }
        }

        List<Round> rounds = roundRepository.findByEventId(event.getId()).stream()
                .filter(r -> round.getId() == null || !r.getId().equals(round.getId()))
                .collect(Collectors.toList());
        rounds.add(round);
        rounds.sort(Comparator.comparing(Round::getRoundSeq));

        for (int i = 1; i < rounds.size(); i++) {
            Round prev = rounds.get(i - 1);
            Round curr = rounds.get(i);
            java.time.LocalDateTime prevEndTime = prev.getStartTime().plusMinutes((long)(prev.getDurationHours() * 60));
            if (curr.getStartTime().isBefore(prevEndTime)) {
                throw new BusinessException(String.format("Round %d must start after Round %d ends.", curr.getRoundSeq(), prev.getRoundSeq()));
            }
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
        response.setDurationHours(round.getDurationHours());
        response.setPromotionTopN(round.getPromotionTopN());
        response.setStatus(round.getStatus());
        response.setRoundSeq(round.getRoundSeq());
        response.setCreatedAt(round.getCreatedAt());
        response.setUpdatedAt(round.getUpdatedAt());
        return response;
    }
}
