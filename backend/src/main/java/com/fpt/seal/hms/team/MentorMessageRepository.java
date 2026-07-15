package com.fpt.seal.hms.team;

import com.fpt.seal.hms.team.entity.MentorMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorMessageRepository extends JpaRepository<MentorMessage, Long> {
    List<MentorMessage> findByTeamIdOrderByCreatedAtAsc(Long teamId);
}
