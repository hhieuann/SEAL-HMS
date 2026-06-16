package com.fpt.seal.hms.teammember.dto;

import com.fpt.seal.hms.common.enums.MemberRole;
import com.fpt.seal.hms.common.enums.MemberStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamMemberResponse {
    private Long id;
    private Long teamId;
    private Long accountId;
    private String accountName;
    private MemberRole role;
    private MemberStatus status;
}
