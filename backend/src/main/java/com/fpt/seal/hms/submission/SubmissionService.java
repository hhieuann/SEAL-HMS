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

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(Long roundId, Long teamId) {
        RoundRanking rr = roundRankingRepository.findByRoundIdAndTeamId(roundId, teamId)
                .orElseThrow(() -> new ResourceNotFoundException("No ranking found for this team in this round"));

        Submission submission = submissionRepository.findByRoundRankingId(rr.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        return mapToResponse(submission);
    }

    @Transactional
    public SubmissionResponse upsertSubmission(Long roundId, Long teamId, SubmissionRequest request) {
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

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        Account submitter = accountRepository.findById(request.getSubmittedByAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

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
