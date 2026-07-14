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
    private final EventStaffRepository eventStaffRepository;
    private final com.fpt.seal.hms.account.AccountRepository accountRepository;
    private final com.fpt.seal.hms.staff.StaffRepository staffRepository;

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

    @Transactional
    public EventResponse getEventById(Long id) {
        Event event = findEventEntityById(id);
        event = autoProgressEventStatus(event);
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
        if (request.getMinTeams() != null && request.getMaxTeams() != null && request.getMinTeams() > request.getMaxTeams()) {
            throw new BusinessException("Min teams cannot be greater than max teams.");
        }

        Event event = new Event();
        event.setName(request.getName());
        event.setType(request.getType());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setRegistrationStartDate(request.getRegistrationStartDate());
        event.setRegistrationEndDate(request.getRegistrationEndDate());
        event.setMaxTeams(request.getMaxTeams());
        event.setMinTeams(request.getMinTeams());
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

        // Guard: Prevent updating structural details if ONGOING or COMPLETED
        if (event.getStatus() == EventStatus.ONGOING || event.getStatus() == EventStatus.COMPLETED) {
            if (request.getStartDate() != null && !request.getStartDate().equals(event.getStartDate())) {
                throw new BusinessException("Cannot update start date of an ongoing or completed event.");
            }
            if (request.getMaxTeams() != null && !request.getMaxTeams().equals(event.getMaxTeams())) {
                throw new BusinessException("Cannot update max teams of an ongoing or completed event.");
            }
            if (request.getRegistrationStartDate() != null && !request.getRegistrationStartDate().equals(event.getRegistrationStartDate())) {
                throw new BusinessException("Cannot update registration start date of an ongoing or completed event.");
            }
            if (request.getRegistrationEndDate() != null && !request.getRegistrationEndDate().equals(event.getRegistrationEndDate())) {
                throw new BusinessException("Cannot update registration end date of an ongoing or completed event.");
            }
        }

        if (request.getRegistrationEndDate() != null && request.getRegistrationStartDate() != null &&
            request.getRegistrationEndDate().isBefore(request.getRegistrationStartDate())) {
            throw new IllegalArgumentException("Registration end date must not be before start date.");
        }
        if (request.getMaxTeams() != null && request.getMaxTeams() < 2) {
            throw new IllegalArgumentException("Max teams must be at least 2.");
        }
        if (request.getMinTeams() != null && request.getMaxTeams() != null && request.getMinTeams() > request.getMaxTeams()) {
            throw new BusinessException("Min teams cannot be greater than max teams.");
        }

        event.setName(request.getName());
        event.setType(request.getType());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setRegistrationStartDate(request.getRegistrationStartDate());
        event.setRegistrationEndDate(request.getRegistrationEndDate());
        event.setMaxTeams(request.getMaxTeams());
        event.setMinTeams(request.getMinTeams());
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

        // Task 1.1: Block transition to ONGOING if team count < minTeams
        if (newStatus == EventStatus.ONGOING && event.getMinTeams() != null) {
            long teamCount = teamRepository.countByEventId(id);
            if (teamCount < event.getMinTeams()) {
                throw new BusinessException("Cannot start event. Minimum teams required: " + event.getMinTeams() + ", currently registered: " + teamCount);
            }
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
        response.setMinTeams(event.getMinTeams());
        response.setStatus(event.getStatus());
        response.setDescription(event.getDescription());
        response.setCreatedAt(event.getCreatedAt());
        response.setUpdatedAt(event.getUpdatedAt());
        response.setCurrentTeams((int) teamRepository.countByEventId(event.getId()));
        
        boolean isRegOpen = true;
        java.time.LocalDate today = java.time.LocalDate.now();
        if (event.getRegistrationEndDate() != null && today.isAfter(event.getRegistrationEndDate())) {
            isRegOpen = false;
        }
        if (event.getRegistrationStartDate() != null && today.isBefore(event.getRegistrationStartDate())) {
            isRegOpen = false;
        }
        if (event.getMaxTeams() != null && response.getCurrentTeams() >= event.getMaxTeams()) {
            isRegOpen = false;
        }
        response.setRegistrationOpen(isRegOpen);
        
        return response;
    }

    private Event autoProgressEventStatus(Event event) {
        EventStatus status = event.getStatus();
        java.time.LocalDate today = java.time.LocalDate.now();
        boolean changed = false;

        if (status == EventStatus.PLANNED && event.getRegistrationStartDate() != null && !today.isBefore(event.getRegistrationStartDate())) {
            event.setStatus(EventStatus.UPCOMING);
            changed = true;
        } else if (status == EventStatus.UPCOMING) {
            boolean regClosed = event.getRegistrationEndDate() != null && today.isAfter(event.getRegistrationEndDate());
            boolean teamFull = event.getMaxTeams() != null && teamRepository.countByEventId(event.getId()) >= event.getMaxTeams();
            if (regClosed || teamFull) {
                // Task 1.1: Only auto-progress to ONGOING if minTeams is met
                long teamCount = teamRepository.countByEventId(event.getId());
                boolean meetsMinTeams = event.getMinTeams() == null || teamCount >= event.getMinTeams();
                if (meetsMinTeams) {
                    event.setStatus(EventStatus.ONGOING);
                    changed = true;
                }
            }
        } else if (status == EventStatus.ONGOING && event.getEndDate() != null && today.isAfter(event.getEndDate())) {
            event.setStatus(EventStatus.COMPLETED);
            changed = true;
        }

        if (changed) {
            return eventRepository.save(event);
        }
        return event;
    }

    @Transactional
    public void assignStaff(Long eventId, Long accountId) {
        if (eventStaffRepository.existsByEvent_IdAndAccount_Id(eventId, accountId)) {
            throw new com.fpt.seal.hms.common.exception.BusinessException("Staff is already assigned to this event.");
        }
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new com.fpt.seal.hms.common.exception.ResourceNotFoundException("Event not found"));
        com.fpt.seal.hms.account.Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new com.fpt.seal.hms.common.exception.ResourceNotFoundException("Account not found"));
        
        if (account.getRole() != com.fpt.seal.hms.common.enums.Role.STAFF) {
            throw new com.fpt.seal.hms.common.exception.BusinessException("Account is not a STAFF member.");
        }

        com.fpt.seal.hms.event.entity.EventStaff es = new com.fpt.seal.hms.event.entity.EventStaff();
        es.setEvent(event);
        es.setAccount(account);
        eventStaffRepository.save(es);
    }

    @Transactional
    public void removeStaff(Long eventId, Long accountId) {
        com.fpt.seal.hms.event.entity.EventStaff es = eventStaffRepository.findByEvent_IdAndAccount_Id(eventId, accountId)
                .orElseThrow(() -> new com.fpt.seal.hms.common.exception.ResourceNotFoundException("Assignment not found"));
        eventStaffRepository.delete(es);
    }

    @Transactional(readOnly = true)
    public List<com.fpt.seal.hms.event.dto.EventStaffResponse> getAssignedStaff(Long eventId) {
        return eventStaffRepository.findByEvent_Id(eventId).stream().map(es -> {
            com.fpt.seal.hms.account.Account acc = es.getAccount();
            com.fpt.seal.hms.staff.entity.Staff staff = staffRepository.findByAccount_Id(acc.getId()).orElse(null);
            return new com.fpt.seal.hms.event.dto.EventStaffResponse(
                    acc.getId(),
                    acc.getEmail(),
                    staff != null ? staff.getFullName() : acc.getEmail(),
                    staff != null ? staff.getDepartment() : null
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public void verifyStaffAccess(Long eventId, String email) {
        com.fpt.seal.hms.account.Account acc = accountRepository.findByEmail(email)
                .orElseThrow(() -> new com.fpt.seal.hms.common.exception.ResourceNotFoundException("Account not found"));
        if (acc.getRole() == com.fpt.seal.hms.common.enums.Role.ADMIN) {
            return; // Admins have global access
        }
        if (acc.getRole() == com.fpt.seal.hms.common.enums.Role.STAFF) {
            if (!eventStaffRepository.existsByEvent_IdAndAccount_Id(eventId, acc.getId())) {
                throw new com.fpt.seal.hms.common.exception.BusinessException("You are not authorized to manage this event.");
            }
            return;
        }
        throw new com.fpt.seal.hms.common.exception.BusinessException("Unauthorized role for event management.");
    }
}
