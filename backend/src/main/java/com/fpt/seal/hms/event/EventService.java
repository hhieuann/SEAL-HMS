package com.fpt.seal.hms.event;

import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.dto.EventDuplicateRequest;
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
    private final com.fpt.seal.hms.auditlog.AuditLogService auditLogService;
    private final com.fpt.seal.hms.roundranking.RoundRankingRepository roundRankingRepository;
    private final com.fpt.seal.hms.submission.SubmissionRepository submissionRepository;
    private final com.fpt.seal.hms.score.ScoreRepository scoreRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.fpt.seal.hms.track.TrackRepository trackRepository;
    private final com.fpt.seal.hms.topic.TopicRepository topicRepository;
    private final com.fpt.seal.hms.round.RoundRepository roundRepository;
    private final com.fpt.seal.hms.criterion.CriterionRepository criterionRepository;

    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        // Newest first with an explicit ORDER BY — findAll() does not guarantee any order,
        // so the FE must not rely on insertion order / reverse() to show the latest event.
        return eventRepository.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(event -> {
                    event = autoProgressEventStatus(event);
                    EventResponse response = mapToResponse(event);
                    response.setRounds(roundService.getRoundsByEventId(event.getId()));
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getAssignedEvents(String email) {
        return eventRepository.findEventsAssignedToExpertByEmail(email).stream()
                .map(event -> {
                    event = autoProgressEventStatus(event);
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
        validateEventDates(request);
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

        auditLogService.log("EVENT_CREATED", "event", savedEvent.getId(), savedEvent.getName());

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

        validateEventDates(request);
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

        Event savedEvent = eventRepository.save(event);
        auditLogService.log("EVENT_UPDATED", "event", savedEvent.getId(), savedEvent.getName());
        return mapToResponse(savedEvent);
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
        Event savedEvent = eventRepository.save(event);
        auditLogService.log("EVENT_STATUS_CHANGED", "event", savedEvent.getId(),
                savedEvent.getName() + ": " + currentStatus + " -> " + newStatus);
        return mapToResponse(savedEvent);
    }

    @Transactional
    public EventResponse cancelEvent(Long id) {
        Event event = findEventEntityById(id);

        if (event.getStatus() != EventStatus.UPCOMING && event.getStatus() != EventStatus.PLANNED) {
            throw new BusinessException("Only PLANNED or UPCOMING events can be cancelled.");
        }

        // 1. Delete all teams and members to free up students
        jdbcTemplate.update("DELETE FROM mentor_message WHERE team_id IN (SELECT team_id FROM team WHERE event_id = ?)", id);
        jdbcTemplate.update("DELETE FROM team_member WHERE team_id IN (SELECT team_id FROM team WHERE event_id = ?)", id);
        jdbcTemplate.update("DELETE FROM round_ranking WHERE team_id IN (SELECT team_id FROM team WHERE event_id = ?)", id);
        jdbcTemplate.update("DELETE FROM team WHERE event_id = ?", id);

        // 2. Delete event staff so they are unassigned
        jdbcTemplate.update("DELETE FROM event_staff WHERE event_id = ?", id);

        // 3. Change status to CANCELLED
        event.setStatus(EventStatus.CANCELLED);
        Event savedEvent = eventRepository.save(event);
        
        auditLogService.log("EVENT_CANCELLED", "event", id, event.getName());
        return mapToResponse(savedEvent);
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = findEventEntityById(id);

        // Guard: Only allow deleting CANCELLED events
        if (event.getStatus() != EventStatus.CANCELLED) {
            throw new BusinessException("Cannot permanently delete event unless its status is CANCELLED.");
        }

        String name = event.getName();

        // ──────────────────────────────────────────────────────────────
        // Cascading manual delete — order matters due to FK constraints
        // ──────────────────────────────────────────────────────────────

        // 1. score → submission → round_ranking (deepest FK chain)
        jdbcTemplate.update(
            "DELETE FROM score WHERE submission_id IN ("
          + "  SELECT s.submission_id FROM submission s"
          + "  JOIN round_ranking rr ON s.round_ranking_id = rr.round_ranking_id"
          + "  WHERE rr.round_id IN (SELECT round_id FROM round WHERE event_id = ?)"
          + ")", id);
        jdbcTemplate.update(
            "DELETE FROM submission WHERE round_ranking_id IN ("
          + "  SELECT rr.round_ranking_id FROM round_ranking rr"
          + "  WHERE rr.round_id IN (SELECT round_id FROM round WHERE event_id = ?)"
          + ")", id);
        jdbcTemplate.update(
            "DELETE FROM round_ranking WHERE round_id IN ("
          + "  SELECT round_id FROM round WHERE event_id = ?)", id);
        // Also clean up round_ranking by team (in case any were linked via team)
        jdbcTemplate.update(
            "DELETE FROM round_ranking WHERE team_id IN ("
          + "  SELECT team_id FROM team WHERE event_id = ?)", id);

        // 2. Teams: mentor_message → team_member → team
        jdbcTemplate.update("DELETE FROM mentor_message WHERE team_id IN (SELECT team_id FROM team WHERE event_id = ?)", id);
        jdbcTemplate.update("DELETE FROM team_member WHERE team_id IN (SELECT team_id FROM team WHERE event_id = ?)", id);
        // mentor table has optional team_id FK (V28)
        jdbcTemplate.update("DELETE FROM mentor WHERE team_id IN (SELECT team_id FROM team WHERE event_id = ?)", id);
        // prize references team_id (nullable)
        jdbcTemplate.update("UPDATE prize SET team_id = NULL WHERE team_id IN (SELECT team_id FROM team WHERE event_id = ?)", id);
        jdbcTemplate.update("DELETE FROM team WHERE event_id = ?", id);

        // 3. Event staff
        jdbcTemplate.update("DELETE FROM event_staff WHERE event_id = ?", id);

        // 4. Event-level metadata
        jdbcTemplate.update("DELETE FROM announcement WHERE event_id = ?", id);
        jdbcTemplate.update("DELETE FROM prize WHERE event_id = ?", id);

        // 5. topic (has FK to track_id AND round_id) — must go before round & track
        jdbcTemplate.update("DELETE FROM topic WHERE track_id IN (SELECT track_id FROM track WHERE event_id = ?)", id);
        // Also topics directly linked by event_id (V14)
        jdbcTemplate.update("DELETE FROM topic WHERE event_id = ?", id);

        // 6. Round-related: criterion → round
        jdbcTemplate.update("DELETE FROM criterion WHERE round_id IN (SELECT round_id FROM round WHERE event_id = ?)", id);
        jdbcTemplate.update("DELETE FROM round WHERE event_id = ?", id);

        // 7. Track-related: track_assignment → track
        jdbcTemplate.update("DELETE FROM track_assignment WHERE track_id IN (SELECT track_id FROM track WHERE event_id = ?)", id);
        jdbcTemplate.update("DELETE FROM track WHERE event_id = ?", id);

        // 8. Finally, delete the event itself
        eventRepository.delete(event);
        auditLogService.log("EVENT_DELETED", "event", id, name);
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
            long teamCount = teamRepository.countByEventId(event.getId()); // one query, reused below
            boolean regClosed = event.getRegistrationEndDate() != null && today.isAfter(event.getRegistrationEndDate());
            boolean teamFull = event.getMaxTeams() != null && teamCount >= event.getMaxTeams();
            if (regClosed || teamFull) {
                // Task 1.1: Only auto-progress to ONGOING if minTeams is met
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

    private void validateEventDates(EventRequest request) {
        if (request.getRegistrationEndDate() != null && request.getRegistrationStartDate() != null &&
            !request.getRegistrationEndDate().isAfter(request.getRegistrationStartDate())) {
            throw new IllegalArgumentException("Registration end date must be strictly after registration start date.");
        }
        
        if (request.getStartDate() != null && request.getRegistrationEndDate() != null &&
            request.getStartDate().isBefore(request.getRegistrationEndDate().plusDays(1))) {
            throw new IllegalArgumentException("Event start date must be at least 1 day after registration end date.");
        }

        if (request.getEndDate() != null && request.getStartDate() != null &&
            !request.getEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("Event end date must be strictly after event start date.");
        }
    }

    @Transactional
    public void resetEventData(Long eventId) {
        // Delete all scores, submissions, and round rankings for this event
        List<com.fpt.seal.hms.roundranking.entity.RoundRanking> rankings = roundRankingRepository.findByRound_Event_Id(eventId);
        for (com.fpt.seal.hms.roundranking.entity.RoundRanking rr : rankings) {
            java.util.Optional<com.fpt.seal.hms.submission.entity.Submission> subOpt = submissionRepository.findByRoundRankingId(rr.getId());
            if (subOpt.isPresent()) {
                com.fpt.seal.hms.submission.entity.Submission sub = subOpt.get();
                List<com.fpt.seal.hms.score.entity.Score> scores = scoreRepository.findBySubmissionId(sub.getId());
                scoreRepository.deleteAll(scores);
                submissionRepository.delete(sub);
            }
        }
        roundRankingRepository.deleteAll(rankings);
    }

    /**
     * Start a new edition from an existing one. Copies the parts that describe how the event is
     * run — tracks, their topics, rounds, each round's criteria, and the team limits — and none
     * of the parts that record what happened: no teams, staff, judge or mentor assignments,
     * submissions, scores, rankings or prizes.
     *
     * The copy is always PLANNED with its rounds back at CREATED, whatever state the source is
     * in. Giving a new start date shifts every round by the same number of days, so a schedule
     * that worked in Spring keeps its shape in Summer.
     */
    @Transactional
    public EventResponse duplicateEvent(Long sourceId, EventDuplicateRequest request) {
        Event source = eventRepository.findById(sourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + sourceId));

        Event copy = new Event();
        copy.setName(request.getName());
        copy.setType(source.getType());
        copy.setDescription(source.getDescription());
        copy.setMinTeams(source.getMinTeams());
        copy.setMaxTeams(source.getMaxTeams());
        copy.setStatus(EventStatus.PLANNED);
        copy.setRegistrationStartDate(firstNonNull(request.getRegistrationStartDate(), source.getRegistrationStartDate()));
        copy.setRegistrationEndDate(firstNonNull(request.getRegistrationEndDate(), source.getRegistrationEndDate()));
        copy.setStartDate(firstNonNull(request.getStartDate(), source.getStartDate()));
        copy.setEndDate(firstNonNull(request.getEndDate(), source.getEndDate()));
        Event saved = eventRepository.save(copy);

        // How far the whole schedule moves, so rounds keep their spacing.
        long dayShift = 0;
        if (request.getStartDate() != null && source.getStartDate() != null) {
            dayShift = java.time.temporal.ChronoUnit.DAYS.between(source.getStartDate(), request.getStartDate());
        }

        // Tracks, and the topics that belong to each. A topic keeps its track so the pairing
        // survives, but the draw itself has not happened yet for the new event.
        java.util.Map<Long, com.fpt.seal.hms.track.entity.Track> trackByOldId = new java.util.HashMap<>();
        for (com.fpt.seal.hms.track.entity.Track oldTrack : trackRepository.findByEventId(sourceId)) {
            com.fpt.seal.hms.track.entity.Track t = new com.fpt.seal.hms.track.entity.Track();
            t.setEvent(saved);
            t.setName(oldTrack.getName());
            t.setDescription(oldTrack.getDescription());
            t.setMaxTeams(oldTrack.getMaxTeams());
            trackByOldId.put(oldTrack.getId(), trackRepository.save(t));
        }

        for (com.fpt.seal.hms.topic.entity.Topic oldTopic : topicRepository.findByEventId(sourceId)) {
            com.fpt.seal.hms.topic.entity.Topic topic = new com.fpt.seal.hms.topic.entity.Topic();
            topic.setEvent(saved);
            topic.setName(oldTopic.getName());
            topic.setDescription(oldTopic.getDescription());
            if (oldTopic.getTrack() != null) {
                topic.setTrack(trackByOldId.get(oldTopic.getTrack().getId()));
            }
            topicRepository.save(topic);
        }

        // Rounds, each with its criteria. Status resets: a copied round has not been run.
        List<com.fpt.seal.hms.round.entity.Round> sourceRounds =
                new java.util.ArrayList<>(roundRepository.findByEventId(sourceId));
        sourceRounds.sort(java.util.Comparator.comparing(
                r -> r.getRoundSeq() == null ? Integer.MAX_VALUE : r.getRoundSeq()));

        for (com.fpt.seal.hms.round.entity.Round oldRound : sourceRounds) {
            com.fpt.seal.hms.round.entity.Round round = new com.fpt.seal.hms.round.entity.Round();
            round.setEvent(saved);
            round.setName(oldRound.getName());
            round.setDurationHours(oldRound.getDurationHours());
            round.setPromotionTopN(oldRound.getPromotionTopN());
            round.setRoundSeq(oldRound.getRoundSeq());
            round.setStatus(com.fpt.seal.hms.common.enums.RoundStatus.CREATED);
            round.setStartTime(oldRound.getStartTime() == null
                    ? null : oldRound.getStartTime().plusDays(dayShift));
            com.fpt.seal.hms.round.entity.Round savedRound = roundRepository.save(round);

            for (com.fpt.seal.hms.criterion.entity.Criterion oldCriterion : criterionRepository.findByRoundId(oldRound.getId())) {
                com.fpt.seal.hms.criterion.entity.Criterion c = new com.fpt.seal.hms.criterion.entity.Criterion();
                c.setRound(savedRound);
                c.setName(oldCriterion.getName());
                c.setMaxScore(oldCriterion.getMaxScore());
                c.setWeight(oldCriterion.getWeight());
                criterionRepository.save(c);
            }
        }

        auditLogService.log("EVENT_DUPLICATED", "event", saved.getId(),
                "copied from event " + sourceId + " (" + source.getName() + ")");

        EventResponse response = mapToResponse(saved);
        response.setRounds(roundService.getRoundsByEventId(saved.getId()));
        response.setTracks(trackService.getTracksByEventId(saved.getId()));
        return response;
    }

    private static <T> T firstNonNull(T preferred, T fallback) {
        return preferred != null ? preferred : fallback;
    }
}
