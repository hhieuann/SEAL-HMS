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
import com.fpt.seal.hms.team.dto.TeamRequest;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.team.dto.TeamRequest;
import com.fpt.seal.hms.team.dto.TeamResponse;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
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

        // Randomly pick a track
        Track randomTrack = tracks.get(random.nextInt(tracks.size()));
        team.setTrack(randomTrack);

        // Fetch topics for this track and randomly pick one if available
        List<Topic> topics = topicRepository.findByTrackId(randomTrack.getId());
        if (!topics.isEmpty()) {
            Topic randomTopic = topics.get(random.nextInt(topics.size()));
            team.setTopic(randomTopic);
        }

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
        team.setTrack(track);
        return mapToResponse(teamRepository.save(team));
    }

    private Team findTeamEntityById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
    }

    private TeamResponse mapToResponse(Team team) {
        TeamResponse response = new TeamResponse();
        response.setId(team.getId());
        response.setName(team.getName());
        response.setChapterId(team.getChapter() != null ? team.getChapter().getId() : null);
        response.setTrackId(team.getTrack() != null ? team.getTrack().getId() : null);
        response.setTopicId(team.getTopic() != null ? team.getTopic().getId() : null);
        response.setStatus(team.getStatus());
        response.setEventScore(team.getEventScore());
        response.setEventRank(team.getEventRank());
        response.setCreatedAt(team.getCreatedAt());
        response.setUpdatedAt(team.getUpdatedAt());
        response.setMemberCount(team.getMemberCount() != null ? team.getMemberCount() : 0);
        return response;
    }
}
