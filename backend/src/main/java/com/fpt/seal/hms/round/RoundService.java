package com.fpt.seal.hms.round;

import com.fpt.seal.hms.common.enums.AssignmentRole;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.criterion.CriterionRepository;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.round.dto.RoundRequest;
import com.fpt.seal.hms.round.dto.RoundResponse;
import com.fpt.seal.hms.round.dto.RoundStatusUpdateRequest;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.submission.entity.Submission;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.trackassignment.TrackAssignment;
import com.fpt.seal.hms.trackassignment.TrackAssignmentRepository;
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
    private final RoundRankingRepository roundRankingRepository;
    private final SubmissionRepository submissionRepository;
    private final ScoreRepository scoreRepository;
    private final CriterionRepository criterionRepository;
    private final TrackAssignmentRepository trackAssignmentRepository;
    private final com.fpt.seal.hms.team.TeamRepository teamRepository;

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
            
            // Reset scoringCompleted for all judges when a new round starts
            List<TrackAssignment> assignments = trackAssignmentRepository.findByTrack_Event_Id(round.getEvent().getId());
            for (TrackAssignment assignment : assignments) {
                if (assignment.getRole() == AssignmentRole.JUDGE) {
                    assignment.setScoringCompleted(false);
                }
            }
            trackAssignmentRepository.saveAll(assignments);
        }

        // When moving to SCORING, disqualify teams that did not submit
        if (currentStatus == RoundStatus.ACTIVE && newStatus == RoundStatus.SCORING) {
            disqualifyTeamsWithoutSubmission(round);
        }

        // Validate scoring completeness before moving from SCORING to UNDER_REVIEW
        if (currentStatus == RoundStatus.SCORING && newStatus == RoundStatus.UNDER_REVIEW) {
            validateScoringComplete(round);
        }

        // Eliminate teams that were not promoted when completing the round
        if (currentStatus == RoundStatus.UNDER_REVIEW && newStatus == RoundStatus.COMPLETED) {
            eliminateNonPromotedTeams(round);
        }

        round.setStatus(newStatus);
        return mapToResponse(roundRepository.save(round));
    }

    private void disqualifyTeamsWithoutSubmission(Round round) {
        List<com.fpt.seal.hms.team.entity.Team> eventTeams = teamRepository.findByEventId(round.getEvent().getId());
        for (com.fpt.seal.hms.team.entity.Team team : eventTeams) {
            if (team.getStatus() == com.fpt.seal.hms.common.enums.TeamStatus.REGISTERED ||
                team.getStatus() == com.fpt.seal.hms.common.enums.TeamStatus.CONFIRMED ||
                team.getStatus() == com.fpt.seal.hms.common.enums.TeamStatus.IN_PROGRESS) {
                
                if (team.getTrack() != null) {
                    boolean hasSubmission = roundRankingRepository.findByRoundIdAndTeamId(round.getId(), team.getId()).isPresent();
                    if (!hasSubmission) {
                        team.setStatus(com.fpt.seal.hms.common.enums.TeamStatus.ELIMINATED);
                        team.setIsDisqualified(true);
                        team.setDisqualificationReason("No submission received by round deadline");
                        teamRepository.save(team);
                    }
                }
            }
        }
    }

    /**
     * Completing a round eliminates whoever was not promoted out of it.
     *
     * The final round is the exception: there is no next round to be promoted into, so every
     * team's {@code isPromoted} is false and eliminating on that basis would mark the whole
     * finals field — the champion included — as ELIMINATED. Teams that reach the end of the
     * event finish as COMPLETED instead.
     */
    private void eliminateNonPromotedTeams(Round round) {
        boolean isFinalRound = isFinalRound(round);
        List<RoundRanking> rankings = roundRankingRepository.findByRoundId(round.getId());
        for (RoundRanking rr : rankings) {
            com.fpt.seal.hms.team.entity.Team team = rr.getTeam();
            if (team.getStatus() == com.fpt.seal.hms.common.enums.TeamStatus.ELIMINATED
                    || team.getStatus() == com.fpt.seal.hms.common.enums.TeamStatus.DISQUALIFIED) {
                continue; // already out on its own merits — leave the reason intact
            }
            if (isFinalRound) {
                team.setStatus(com.fpt.seal.hms.common.enums.TeamStatus.COMPLETED);
                teamRepository.save(team);
            } else if (rr.getIsPromoted() == null || !rr.getIsPromoted()) {
                team.setStatus(com.fpt.seal.hms.common.enums.TeamStatus.ELIMINATED);
                teamRepository.save(team);
            }
        }
    }

    private boolean isFinalRound(Round round) {
        Integer maxSeq = roundRepository.findMaxRoundSeqByEventId(round.getEvent().getId()).orElse(null);
        if (maxSeq == null || round.getRoundSeq() == null) {
            return false;
        }
        return round.getRoundSeq() >= maxSeq;
    }

    /**
     * Validates that all judges have submitted scores for all teams in this round.
     * Checks:
     * 1. Every team participating in the round has a submission.
     * 2. Every judge assigned to each team's track has scored ALL criteria for that submission.
     */
    private void validateScoringComplete(Round round) {
        List<RoundRanking> rankings = roundRankingRepository.findByRoundId(round.getId());

        if (rankings.isEmpty()) {
            throw new BusinessException("Cannot end scoring: No teams are participating in this round.");
        }

        List<Criterion> criteria = criterionRepository.findByRoundId(round.getId());
        if (criteria.isEmpty()) {
            throw new BusinessException("Cannot end scoring: No scoring criteria have been defined for this round.");
        }
        int criteriaCount = criteria.size();

        List<String> unscoredTeams = new java.util.ArrayList<>();

        for (RoundRanking rr : rankings) {
            if (rr.getTeam().getIsDisqualified() != null && rr.getTeam().getIsDisqualified()) {
                continue; // Skip disqualified teams
            }

            // Check if submission exists
            Submission submission = submissionRepository.findByRoundRankingId(rr.getId()).orElse(null);
            if (submission == null) {
                unscoredTeams.add(rr.getTeam().getName() + " (no submission)");
                continue;
            }

            // Find judges assigned to this team's track
            Long trackId = rr.getTeam().getTrack() != null ? rr.getTeam().getTrack().getId() : null;
            if (trackId == null) {
                unscoredTeams.add(rr.getTeam().getName() + " (no track assigned)");
                continue;
            }

            List<TrackAssignment> judgeAssignments = trackAssignmentRepository.findByTrack_Id(trackId)
                    .stream()
                    .filter(a -> a.getRole() == AssignmentRole.JUDGE)
                    .collect(Collectors.toList());

            if (judgeAssignments.isEmpty()) {
                unscoredTeams.add(rr.getTeam().getName() + " (no judges assigned to track)");
                continue;
            }

            // Check that each judge has explicitly clicked "Complete Scoring"
            for (TrackAssignment ja : judgeAssignments) {
                if (ja.getScoringCompleted() == null || !ja.getScoringCompleted()) {
                    String judgeName = ja.getLecturer().getFullName() != null ? ja.getLecturer().getFullName() : ja.getLecturer().getAccount().getEmail();
                    unscoredTeams.add(rr.getTeam().getName() + " (Judge \"" + judgeName + "\" chưa bấm hoàn thành chấm bài)");
                }
            }
        }

        if (!unscoredTeams.isEmpty()) {
            String details = String.join("; ", unscoredTeams);
            throw new BusinessException("Cannot end scoring: Incomplete scores detected. " + details);
        }
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
        if (next == RoundStatus.CREATED) {
            return; // Allow resetting to CREATED for Draw Resets
        }
        
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
