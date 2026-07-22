package com.fpt.seal.hms.team;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.chapter.ChapterRepository;
import com.fpt.seal.hms.chapter.entity.Chapter;
import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.enums.MemberRole;
import com.fpt.seal.hms.common.enums.MemberStatus;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.team.dto.TeamRequest;
import com.fpt.seal.hms.team.dto.TeamResponse;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.trackassignment.TrackAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final ChapterRepository chapterRepository;
    private final TrackRepository trackRepository;
    private final TopicRepository topicRepository;
    private final AccountRepository accountRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final EventRepository eventRepository;
    private final LecturerRepository lecturerRepository;
    private final com.fpt.seal.hms.roundranking.RoundRankingRepository roundRankingRepository;
    private final TrackAssignmentRepository trackAssignmentRepository;
    private final MentorMessageRepository mentorMessageRepository;
    private final com.fpt.seal.hms.account.AccountService accountService;
    private final Random random = new Random();

    @Transactional(readOnly = true)
    public TeamResponse getTeamById(Long id) {
        return mapToResponse(findTeamEntityById(id));
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getTeamsByEventId(Long eventId) {
        return teamRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamResponse createTeam(Long eventId, TeamRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        java.util.List<com.fpt.seal.hms.teammember.entity.TeamMember> existingInEvent = teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(
                request.getLeaderAccountId(), eventId, com.fpt.seal.hms.common.enums.MemberStatus.DECLINED);
        if (!existingInEvent.isEmpty()) {
            throw new BusinessException("You are already a member of another team in this event and cannot create a new one.");
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        if (event.getRegistrationStartDate() != null && today.isBefore(event.getRegistrationStartDate())) {
            throw new BusinessException("Registration for this event has not started yet.");
        }
        if (event.getRegistrationEndDate() != null && today.isAfter(event.getRegistrationEndDate())) {
            throw new BusinessException("Registration for this event has closed.");
        }

        if (event.getMaxTeams() != null) {
            long currentTeams = teamRepository.countByEventId(eventId);
            if (currentTeams >= event.getMaxTeams()) {
                throw new BusinessException("Event has reached its maximum number of teams.");
            }
        }

        Team team = new Team();
        team.setEvent(event);
        team.setName(request.getName());
        team.setStatus(TeamStatus.CREATED);

        if (request.getChapterId() != null) {
            Chapter chapter = chapterRepository.findById(request.getChapterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chapter not found"));
            team.setChapter(chapter);
        }

        Team savedTeam = teamRepository.save(team);

        // Assign the creator as the LEADER automatically
        Account leaderAccount = accountRepository.findById(request.getLeaderAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Leader account not found"));

        TeamMember leader = new TeamMember();
        leader.setTeam(savedTeam);
        leader.setAccount(leaderAccount);
        leader.setRole(MemberRole.LEADER);
        leader.setStatus(MemberStatus.ACCEPTED);
        teamMemberRepository.save(leader);

        return mapToResponse(savedTeam);
    }

    @Transactional
    public TeamResponse updateTeamStatus(Long id, TeamStatus status) {
        Team team = findTeamEntityById(id);

        if (status == TeamStatus.REGISTERED) {
            long acceptedMembers = teamMemberRepository.countByTeamIdAndStatus(id, MemberStatus.ACCEPTED);
            if (acceptedMembers < 3 || acceptedMembers > 5) {
                throw new BusinessException("Cannot approve team. A team must have between 3 and 5 accepted members. Current count: " + acceptedMembers);
            }
        }

        team.setStatus(status);
        if (status == TeamStatus.REJECTED) {
            team.setEvent(null);
            team.setTrack(null);
        }
        return mapToResponse(teamRepository.save(team));
    }

    @Transactional
    public TeamResponse assignRandomTrackAndTopic(Long teamId, Long eventId) {
        Team team = findTeamEntityById(teamId);

        if (team.getEvent() != null && (team.getEvent().getStatus() == EventStatus.PLANNED || team.getEvent().getStatus() == EventStatus.UPCOMING)) {
            throw new BusinessException("Cannot assign tracks while registration is still open. Please lock registration first.");
        }

        if (team.getStatus() != TeamStatus.REGISTERED) {
            throw new BusinessException("Team must be APPROVED (REGISTERED) by staff before assigning track.");
        }

        List<Track> tracks = trackRepository.findByEventId(eventId);
        if (tracks.isEmpty()) {
            throw new BusinessException("Cannot assign randomly because there are no tracks in this event.");
        }

        // Balanced draw instead of a pure random pick: always assign into the track(s)
        // with the fewest teams that still have capacity. With N teams over K tracks the
        // spread never differs by more than 1 (e.g. 7 teams / 3 tracks -> 3-2-2), which is
        // the fairest split possible when per-track promotion is used later.
        Track randomTrack = pickLeastLoadedTrackWithCapacity(tracks, team);
        team.setTrack(randomTrack);

        // Fetch topics for this track and randomly pick one if available
        List<Topic> topics = topicRepository.findByTrackId(randomTrack.getId());
        if (!topics.isEmpty()) {
            Topic randomTopic = topics.get(random.nextInt(topics.size()));
            team.setTopic(randomTopic);
        }

        // Auto-clear mentor if they are a judge for the new track (conflict of interest)
        clearMentorIfJudgeConflict(team);

        return mapToResponse(teamRepository.save(team));
    }

    /** Assign a specific track to a team (used by Admin after FE spin animation). */
    @Transactional
    public TeamResponse assignTrack(Long teamId, Long trackId) {
        Team team = findTeamEntityById(teamId);

        if (team.getEvent() != null && (team.getEvent().getStatus() == EventStatus.PLANNED || team.getEvent().getStatus() == EventStatus.UPCOMING)) {
            throw new BusinessException("Cannot assign tracks while registration is still open. Please lock registration first.");
        }

        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with id: " + trackId));
        requireTrackCapacity(track, team);
        team.setTrack(track);

        // Auto-clear mentor if they are a judge for the new track (conflict of interest)
        clearMentorIfJudgeConflict(team);

        return mapToResponse(teamRepository.save(team));
    }

    /**
     * Fewest-teams-first draw: among the tracks that still have room (maxTeams == null
     * means unlimited), pick randomly between the least-loaded ones. A team already on
     * a track does not count against that track's capacity for itself.
     */
    private Track pickLeastLoadedTrackWithCapacity(List<Track> tracks, Team team) {
        List<Track> leastLoaded = new java.util.ArrayList<>();
        long minCount = Long.MAX_VALUE;
        for (Track track : tracks) {
            long count = countOtherTeams(track, team);
            if (track.getMaxTeams() != null && count >= track.getMaxTeams()) {
                continue; // full
            }
            if (count < minCount) {
                minCount = count;
                leastLoaded.clear();
                leastLoaded.add(track);
            } else if (count == minCount) {
                leastLoaded.add(track);
            }
        }
        if (leastLoaded.isEmpty()) {
            throw new BusinessException("All tracks of this event are full (max teams reached). "
                    + "Increase a track's max teams or add another track before assigning.");
        }
        return leastLoaded.get(random.nextInt(leastLoaded.size()));
    }

    /** Reject a manual assignment into a track that is already at max capacity. */
    private void requireTrackCapacity(Track track, Team team) {
        if (track.getMaxTeams() != null && countOtherTeams(track, team) >= track.getMaxTeams()) {
            throw new BusinessException("Track '" + track.getName() + "' is full ("
                    + track.getMaxTeams() + " teams max). Choose another track or raise its limit.");
        }
    }

    private long countOtherTeams(Track track, Team team) {
        long count = teamRepository.countByTrackId(track.getId());
        boolean alreadyOnThisTrack = team.getTrack() != null && track.getId().equals(team.getTrack().getId());
        return alreadyOnThisTrack ? count - 1 : count;
    }

    /**
     * If this team's mentor is also assigned as a JUDGE for the team's current track,
     * automatically remove the mentor to avoid conflict of interest.
     */
    private void clearMentorIfJudgeConflict(Team team) {
        if (team.getMentor() == null || team.getTrack() == null) {
            return;
        }
        boolean isJudge = trackAssignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(
                team.getTrack().getId(),
                team.getMentor().getId(),
                com.fpt.seal.hms.common.enums.AssignmentRole.JUDGE);
        if (isJudge) {
            team.setMentor(null);
        }
    }

    @Transactional
    public TeamResponse disqualifyTeam(Long teamId, boolean disqualified, String reason) {
        Team team = findTeamEntityById(teamId);
        team.setIsDisqualified(disqualified);
        if (disqualified) {
            team.setDisqualificationReason(reason);
            team.setStatus(com.fpt.seal.hms.common.enums.TeamStatus.DISQUALIFIED);
        } else {
            team.setDisqualificationReason(null);
            // When requalifying, if they were eliminated or disqualified, bring them back to IN_PROGRESS
            if (team.getStatus() == com.fpt.seal.hms.common.enums.TeamStatus.DISQUALIFIED || 
                team.getStatus() == com.fpt.seal.hms.common.enums.TeamStatus.ELIMINATED) {
                team.setStatus(com.fpt.seal.hms.common.enums.TeamStatus.IN_PROGRESS);
            }
        }
        return mapToResponse(teamRepository.save(team));
    }

    @Transactional
    public TeamResponse applyPenalty(Long teamId, Long roundId, java.math.BigDecimal penaltyPoints, String penaltyReason) {
        com.fpt.seal.hms.roundranking.entity.RoundRanking rr = roundRankingRepository.findByRoundIdAndTeamId(roundId, teamId)
                .orElseThrow(() -> new ResourceNotFoundException("RoundRanking not found for team " + teamId + " in round " + roundId));
        
        java.math.BigDecimal oldPenalty = rr.getPenaltyPoints() != null ? rr.getPenaltyPoints() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal newPenalty = penaltyPoints != null ? penaltyPoints : java.math.BigDecimal.ZERO;
        
        rr.setPenaltyPoints(penaltyPoints);
        rr.setPenaltyReason(penaltyReason);
        
        if (rr.getScore() != null) {
            rr.setScore(rr.getScore().add(oldPenalty).subtract(newPenalty));
        }
        
        roundRankingRepository.save(rr);
        
        return getTeamById(teamId);
    }

    private Team findTeamEntityById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
    }

    @Transactional
    public TeamResponse assignMentor(Long teamId, Long mentorId) {
        Team team = findTeamEntityById(teamId);
        
        // Allow removing mentor by passing null
        if (mentorId == null) {
            team.setMentor(null);
            return mapToResponse(teamRepository.save(team));
        }
        
        if (team.getTrack() == null) {
            throw new BusinessException("Team must be assigned to a track before a mentor can be assigned.");
        }
        
        com.fpt.seal.hms.lecturer.Lecturer lecturer = lecturerRepository
            .findById(mentorId).orElseThrow(() -> new ResourceNotFoundException("Lecturer not found: " + mentorId));
            
        // VALIDATION: Check if this lecturer is already a JUDGE for this track
        boolean isJudge = trackAssignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(
            team.getTrack().getId(), mentorId, com.fpt.seal.hms.common.enums.AssignmentRole.JUDGE);
            
        if (isJudge) {
            throw new BusinessException("This lecturer is already a Judge for this track. They cannot also be a Mentor for a team in the same track.");
        }
        
        team.setMentor(lecturer);
        return mapToResponse(teamRepository.save(team));
    }

    private TeamResponse mapToResponse(Team team) {
        TeamResponse response = new TeamResponse();
        response.setId(team.getId());
        response.setName(team.getName());
        response.setChapterId(team.getChapter() != null ? team.getChapter().getId() : null);
        response.setTrackId(team.getTrack() != null ? team.getTrack().getId() : null);
        response.setTopicId(team.getTopic() != null ? team.getTopic().getId() : null);
        response.setStatus(team.getStatus());
        response.setIsDisqualified(team.getIsDisqualified());
        response.setDisqualificationReason(team.getDisqualificationReason());
        response.setEventScore(team.getEventScore());
        response.setEventRank(team.getEventRank());
        response.setCreatedAt(team.getCreatedAt());
        response.setUpdatedAt(team.getUpdatedAt());
        response.setMemberCount(team.getMemberCount() != null ? team.getMemberCount() : 0);
        
        if (team.getMentor() != null) {
            TeamResponse.MentorDto dto = new TeamResponse.MentorDto();
            dto.setLecturerId(team.getMentor().getId());
            dto.setName(team.getMentor().getFullName() != null ? team.getMentor().getFullName() : (team.getMentor().getAccount() != null ? team.getMentor().getAccount().getEmail() : "Unknown"));
            dto.setEmail(team.getMentor().getAccount() != null ? team.getMentor().getAccount().getEmail() : "");
            response.setMentor(dto);
        } else {
            response.setMentor(null);
        }
        
        return response;
    }

    @Transactional
    public void resetAllMentorsByEvent(Long eventId) {
        List<Team> teams = teamRepository.findByEventId(eventId);
        for (Team team : teams) {
            team.setMentor(null);
            List<com.fpt.seal.hms.team.entity.MentorMessage> msgs = mentorMessageRepository.findByTeamIdOrderByCreatedAtAsc(team.getId());
            if (!msgs.isEmpty()) {
                mentorMessageRepository.deleteAll(msgs);
            }
        }
        teamRepository.saveAll(teams);
    }

    @Transactional(readOnly = true)
    public List<com.fpt.seal.hms.team.dto.MentorMessageDto> getMentorMessages(Long teamId) {
        Team team = findTeamEntityById(teamId);
        List<com.fpt.seal.hms.team.entity.MentorMessage> messages = mentorMessageRepository.findByTeamIdOrderByCreatedAtAsc(teamId);
        return messages.stream().map(msg -> {
            com.fpt.seal.hms.team.dto.MentorMessageDto dto = new com.fpt.seal.hms.team.dto.MentorMessageDto();
            dto.setId(msg.getId());
            dto.setTeamId(msg.getTeam().getId());
            dto.setSenderId(msg.getSender().getId());
            String fullName = accountService.getFullName(msg.getSender());
            if (fullName == null || fullName.trim().isEmpty()) {
                fullName = msg.getSender().getEmail().split("@")[0];
            }
            dto.setSenderName(fullName);
            dto.setSenderRole(msg.getSender().getRole().name());
            dto.setMessage(msg.getMessage());
            dto.setCreatedAt(msg.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public com.fpt.seal.hms.team.dto.MentorMessageDto sendMentorMessageByEmail(Long teamId, String email, String message) {
        Team team = findTeamEntityById(teamId);
        Account sender = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with email: " + email));
        
        com.fpt.seal.hms.team.entity.MentorMessage mentorMessage = new com.fpt.seal.hms.team.entity.MentorMessage();
        mentorMessage.setTeam(team);
        mentorMessage.setSender(sender);
        mentorMessage.setMessage(message);
        
        com.fpt.seal.hms.team.entity.MentorMessage saved = mentorMessageRepository.save(mentorMessage);
        
        com.fpt.seal.hms.team.dto.MentorMessageDto dto = new com.fpt.seal.hms.team.dto.MentorMessageDto();
        dto.setId(saved.getId());
        dto.setTeamId(saved.getTeam().getId());
        dto.setSenderId(saved.getSender().getId());
        String fullName = accountService.getFullName(saved.getSender());
        if (fullName == null || fullName.trim().isEmpty()) {
            fullName = saved.getSender().getEmail().split("@")[0];
        }
        dto.setSenderName(fullName);
        dto.setSenderRole(saved.getSender().getRole().name());
        dto.setMessage(saved.getMessage());
        dto.setCreatedAt(saved.getCreatedAt());
        return dto;
    }
}
