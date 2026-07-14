package com.fpt.seal.hms;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.Test;

import java.util.List;

@SpringBootTest
public class GetTestUsers {

    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private com.fpt.seal.hms.student.StudentRepository studentRepository;

    @Test
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.test.annotation.Commit
    public void printUsers() {
        Event event = null;
        for (Event e : eventRepository.findAll()) {
            if ("TEST11".equals(e.getName())) {
                event = e;
                break;
            }
        }
        
        if (event == null) {
            System.out.println("EVENT_NOT_FOUND");
            return;
        }

        // Delete empty teams
        List<Team> teams = teamRepository.findByEventId(event.getId());
        for (Team t : teams) {
            long count = teamMemberRepository.countByTeamIdAndStatus(t.getId(), com.fpt.seal.hms.common.enums.MemberStatus.ACCEPTED);
            if (count == 0) {
                System.out.println("Deleting empty team: " + t.getName() + " (ID: " + t.getId() + ")");
                // First delete members if any exist (even if not accepted)
                List<TeamMember> members = teamMemberRepository.findByTeamId(t.getId());
                teamMemberRepository.deleteAll(members);
                // Delete team
                teamRepository.delete(t);
            }
        }
    }
}
