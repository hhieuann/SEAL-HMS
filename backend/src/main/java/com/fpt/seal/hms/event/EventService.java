package com.fpt.seal.hms.event;

import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.dto.EventRequest;
import com.fpt.seal.hms.event.dto.EventResponse;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.round.RoundService;
import com.fpt.seal.hms.round.dto.RoundRequest;
import com.fpt.seal.hms.track.TrackService;
import com.fpt.seal.hms.track.dto.TrackRequest;
import com.fpt.seal.hms.team.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final RoundService roundService;
    private final TrackService trackService;
    private final TeamRepository teamRepository;

    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(event -> {
                    EventResponse response = mapToResponse(event);
                    response.setRounds(roundService.getRoundsByEventId(event.getId()));
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getAssignedEvents(String email) {
        return eventRepository.findEventsAssignedToJudgeByEmail(email).stream()
                .map(event -> {
                    EventResponse response = mapToResponse(event);
                    response.setRounds(roundService.getRoundsByEventId(event.getId()));
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        Event event = findEventEntityById(id);
        EventResponse response = mapToResponse(event);
        response.setRounds(roundService.getRoundsByEventId(id));
        response.setTracks(trackService.getTracksByEventId(id));
        return response;
    }

    @Transactional
    public EventResponse createEvent(EventRequest request) {
        if (request.getRegistrationEndDate() != null && request.getRegistrationStartDate() != null &&
            request.getRegistrationEndDate().isBefore(request.getRegistrationStartDate())) {
            throw new IllegalArgumentException("Registration end date must not be before start date.");
        }
        if (request.getMaxTeams() != null && request.getMaxTeams() < 2) {
            throw new IllegalArgumentException("Max teams must be at least 2.");
        }

        Event event = new Event();
        event.setName(request.getName());
        event.setType(request.getType());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setRegistrationStartDate(request.getRegistrationStartDate());
        event.setRegistrationEndDate(request.getRegistrationEndDate());
        event.setMaxTeams(request.getMaxTeams());
        event.setDescription(request.getDescription());
        event.setStatus(EventStatus.PLANNED); // default status

        Event savedEvent = eventRepository.save(event);

        if (request.getRounds() != null && !request.getRounds().isEmpty()) {
            for (RoundRequest roundReq : request.getRounds()) {
                roundService.createRound(savedEvent.getId(), roundReq);
            }
        }

        if (request.getTracks() != null && !request.getTracks().isEmpty()) {
            for (TrackRequest trackReq : request.getTracks()) {
                trackService.createTrack(savedEvent.getId(), trackReq);
            }
        }

        EventResponse response = mapToResponse(savedEvent);
        response.setRounds(roundService.getRoundsByEventId(savedEvent.getId()));
        response.setTracks(trackService.getTracksByEventId(savedEvent.getId()));
        return response;
    }

    @Transactional
    public EventResponse updateEvent(Long id, EventRequest request) {
        Event event = findEventEntityById(id);

        // Guard: Prevent updating details if ONGOING or COMPLETED
        if (event.getStatus() == EventStatus.ONGOING || event.getStatus() == EventStatus.COMPLETED) {
            throw new BusinessException("Cannot update event details when status is " + event.getStatus());
        }

        if (request.getRegistrationEndDate() != null && request.getRegistrationStartDate() != null &&
            request.getRegistrationEndDate().isBefore(request.getRegistrationStartDate())) {
            throw new IllegalArgumentException("Registration end date must not be before start date.");
        }
        if (request.getMaxTeams() != null && request.getMaxTeams() < 2) {
            throw new IllegalArgumentException("Max teams must be at least 2.");
        }

        event.setName(request.getName());
        event.setType(request.getType());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setRegistrationStartDate(request.getRegistrationStartDate());
        event.setRegistrationEndDate(request.getRegistrationEndDate());
        event.setMaxTeams(request.getMaxTeams());
        event.setDescription(request.getDescription());

        // Validate that the new maxTeams does not violate existing rounds' promotion pools
        roundService.validateSequentialPromotionTopN(event);

        return mapToResponse(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEventStatus(Long id, EventStatus newStatus) {
        Event event = findEventEntityById(id);
        EventStatus currentStatus = event.getStatus();

        if (currentStatus == newStatus) {
            return mapToResponse(event);
        }

        validateStatusTransition(currentStatus, newStatus);
        
        event.setStatus(newStatus);
        return mapToResponse(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = findEventEntityById(id);

        // Guard: Prevent deleting if ONGOING or COMPLETED
        if (event.getStatus() == EventStatus.ONGOING || event.getStatus() == EventStatus.COMPLETED) {
            throw new BusinessException("Cannot delete event when status is " + event.getStatus());
        }

        eventRepository.delete(event);
    }

    private void validateStatusTransition(EventStatus current, EventStatus next) {
        // Any status except COMPLETED can be CANCELLED
        if (next == EventStatus.CANCELLED) {
            if (current == EventStatus.COMPLETED) {
                throw new BusinessException("Cannot cancel a completed event");
            }
            return;
        }

        boolean isValid = false;
        switch (current) {
            case PLANNED:
                isValid = (next == EventStatus.UPCOMING);
                break;
            case UPCOMING:
                isValid = (next == EventStatus.ONGOING || next == EventStatus.PLANNED);
                break;
            case ONGOING:
                isValid = (next == EventStatus.COMPLETED);
                break;
            case COMPLETED:
            case CANCELLED:
                // Cannot transition out of terminal states
                isValid = false;
                break;
        }

        if (!isValid) {
            throw new BusinessException(String.format("Invalid status transition from %s to %s", current, next));
        }
    }

    private Event findEventEntityById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    private EventResponse mapToResponse(Event event) {
        EventResponse response = new EventResponse();
        response.setId(event.getId());
        response.setName(event.getName());
        response.setType(event.getType());
        response.setStartDate(event.getStartDate());
        response.setEndDate(event.getEndDate());
        response.setRegistrationStartDate(event.getRegistrationStartDate());
        response.setRegistrationEndDate(event.getRegistrationEndDate());
        response.setMaxTeams(event.getMaxTeams());
        response.setStatus(event.getStatus());
        response.setDescription(event.getDescription());
        response.setCreatedAt(event.getCreatedAt());
        response.setUpdatedAt(event.getUpdatedAt());
        response.setCurrentTeams((int) teamRepository.countByEventId(event.getId()));
        return response;
    }
}
