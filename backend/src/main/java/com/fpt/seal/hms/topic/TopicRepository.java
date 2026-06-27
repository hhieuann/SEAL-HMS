package com.fpt.seal.hms.topic;

import com.fpt.seal.hms.topic.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByTrackId(Long trackId);
    List<Topic> findByEventId(Long eventId);
}
