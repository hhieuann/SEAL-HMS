package com.fpt.seal.hms.submission;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.enums.SubmissionStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.round.RoundRepository;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.submission.dto.SubmissionRequest;
import com.fpt.seal.hms.submission.dto.SubmissionResponse;
import com.fpt.seal.hms.submission.entity.Submission;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final RoundRankingRepository roundRankingRepository;
    private final RoundRepository roundRepository;
    private final TeamRepository teamRepository;
    private final AccountRepository accountRepository;
    private final com.fpt.seal.hms.score.ScoreRepository scoreRepository;
    private final com.fpt.seal.hms.teammember.TeamMemberRepository teamMemberRepository;

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(Long roundId, Long teamId) {
        RoundRanking rr = roundRankingRepository.findByRoundIdAndTeamId(roundId, teamId)
                .orElseThrow(() -> new ResourceNotFoundException("No ranking found for this team in this round"));

        Submission submission = submissionRepository.findByRoundRankingId(rr.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        return mapToResponse(submission);
    }

    @Transactional
    public SubmissionResponse upsertSubmission(Long roundId, Long teamId, SubmissionRequest request, String actorEmail) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round not found"));

        if (round.getStatus() != RoundStatus.ACTIVE) {
            throw new BusinessException("Cannot submit: The round is not currently active.");
        }

        if (round.getStartTime() == null || round.getDurationHours() == null) {
            throw new BusinessException("Cannot submit: Round start time or duration is not configured.");
        }

        long minutes = (long)(round.getDurationHours() * 60);
        LocalDateTime endTime = round.getStartTime().plusMinutes(minutes);
        if (LocalDateTime.now().isAfter(endTime)) {
            throw new BusinessException("Deadline has passed. Submissions are now locked for this round.");
        }

        // Eligibility check for subsequent rounds
        if (round.getRoundSeq() > 1) {
            java.util.List<Round> previousRounds = roundRepository.findByEventId(round.getEvent().getId()).stream()
                    .filter(r -> r.getRoundSeq() < round.getRoundSeq())
                    .sorted((r1, r2) -> r2.getRoundSeq().compareTo(r1.getRoundSeq()))
                    .collect(java.util.stream.Collectors.toList());
            if (!previousRounds.isEmpty()) {
                Round previousRound = previousRounds.get(0);
                RoundRanking prevRr = roundRankingRepository.findByRoundIdAndTeamId(previousRound.getId(), teamId)
                        .orElseThrow(() -> new BusinessException("Team did not participate in the previous round."));
                if (prevRr.getIsPromoted() == null || !prevRr.getIsPromoted()) {
                    throw new BusinessException("Cannot submit: Team was not promoted from the previous round.");
                }
            }
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        // The submitter is the AUTHENTICATED user — never trust an id from the request
        // body. Only the team's LEADER may create/update the submission (members can
        // only view); ADMIN keeps access for support/demo purposes.
        Account submitter = accountRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + actorEmail));
        if (submitter.getRole() != com.fpt.seal.hms.common.enums.Role.ADMIN) {
            var membership = teamMemberRepository.findByTeamIdAndAccountId(teamId, submitter.getId())
                    .orElseThrow(() -> new BusinessException("You are not a member of this team."));
            if (membership.getRole() != com.fpt.seal.hms.common.enums.MemberRole.LEADER
                    || membership.getStatus() != com.fpt.seal.hms.common.enums.MemberStatus.ACCEPTED) {
                throw new BusinessException("Only the team leader can submit or update the submission. Members can only view it.");
            }
        }

        // Auto-generate RoundRanking if it doesn't exist
        RoundRanking rr = roundRankingRepository.findByRoundIdAndTeamId(roundId, teamId)
                .orElseGet(() -> {
                    RoundRanking newRr = new RoundRanking();
                    newRr.setRound(round);
                    newRr.setTeam(team);
                    newRr.setIsPromoted(false);
                    return roundRankingRepository.save(newRr);
                });

        Optional<Submission> existingOpt = submissionRepository.findByRoundRankingId(rr.getId());
        Submission submission;

        if (existingOpt.isPresent()) {
            submission = existingOpt.get();
        } else {
            submission = new Submission();
            submission.setRoundRanking(rr);
            submission.setStatus(SubmissionStatus.DRAFT);
        }

        submission.setSubmittedBy(submitter);
        submission.setSubmissionName(request.getSubmissionName());
        submission.setDescription(request.getDescription());
        submission.setTechStackName(request.getTechStackName());
        submission.setGithubUrl(request.getGithubUrl());
        submission.setDemoUrl(request.getDemoUrl());
        submission.setSlideUrl(request.getSlideUrl());
        submission.setSubmittedAt(LocalDateTime.now());

        return mapToResponse(submissionRepository.save(submission));
    }

    private SubmissionResponse mapToResponse(Submission submission) {
        SubmissionResponse response = new SubmissionResponse();
        response.setId(submission.getId());
        response.setRoundRankingId(submission.getRoundRanking().getId());
        response.setTeamId(submission.getRoundRanking().getTeam().getId());
        response.setSubmittedByAccountId(submission.getSubmittedBy() != null ? submission.getSubmittedBy().getId() : null);
        response.setSubmissionName(submission.getSubmissionName());
        response.setDescription(submission.getDescription());
        response.setTechStackName(submission.getTechStackName());
        response.setGithubUrl(submission.getGithubUrl());
        response.setDemoUrl(submission.getDemoUrl());
        response.setSlideUrl(submission.getSlideUrl());
        response.setStatus(submission.getStatus());
        response.setSubmittedAt(submission.getSubmittedAt());
        response.setCreatedAt(submission.getCreatedAt());
        response.setUpdatedAt(submission.getUpdatedAt());
        return response;
    }
}
