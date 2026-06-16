package com.fpt.seal.hms.teammember;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.teammember.dto.TeamMemberRequest;
import com.fpt.seal.hms.teammember.dto.TeamMemberResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/members")
@RequiredArgsConstructor
public class TeamMemberController {

    private final TeamMemberService teamMemberService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamMemberResponse>>> getMembersByTeamId(@PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.ok(teamMemberService.getMembersByTeamId(teamId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeamMemberResponse>> inviteMember(
            @PathVariable Long teamId,
            @Valid @RequestBody TeamMemberRequest request) {
        TeamMemberResponse invited = teamMemberService.inviteMember(teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Member invited successfully", invited));
    }

    @PatchMapping("/{accountId}/accept")
    public ResponseEntity<ApiResponse<TeamMemberResponse>> acceptInvitation(
            @PathVariable Long teamId,
            @PathVariable Long accountId) {
        TeamMemberResponse accepted = teamMemberService.acceptInvitation(teamId, accountId);
        return ResponseEntity.ok(ApiResponse.ok("Invitation accepted successfully", accepted));
    }
}
