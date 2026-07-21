package com.fpt.seal.hms.topic;

import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.topic.dto.TopicRequest;
import com.fpt.seal.hms.topic.dto.TopicResponse;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TopicServiceTest {

    @Mock private TopicRepository topicRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private EventRepository eventRepository;
    @InjectMocks private TopicService topicService;

    private TopicRequest request(String name) {
        TopicRequest r = new TopicRequest();
        r.setName(name);
        r.setDescription("d");
        return r;
    }

    private Track track(long id, Event e) {
        Track t = new Track();
        t.setId(id);
        t.setEvent(e);
        return t;
    }

    @Test
    void createTopicUnderTrack_inheritsTrackAndEvent() {
        Event e = new Event();
        e.setId(1L);
        Track track = track(3L, e);
        when(trackRepository.findById(3L)).thenReturn(Optional.of(track));
        when(topicRepository.save(any(Topic.class))).thenAnswer(inv -> {
            Topic t = inv.getArgument(0);
            t.setId(7L);
            return t;
        });

        TopicResponse res = topicService.createTopicUnderTrack(3L, request("RAG"));

        assertThat(res.getName()).isEqualTo("RAG");
        assertThat(res.getTrackId()).isEqualTo(3L);
    }

    @Test
    void createTopicUnderTrack_throws_whenTrackMissing() {
        when(trackRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> topicService.createTopicUnderTrack(9L, request("X")))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(topicRepository, never()).save(any());
    }

    @Test
    void createTopicUnderEvent_hasNoTrack() {
        Event e = new Event();
        e.setId(1L);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(topicRepository.save(any(Topic.class))).thenAnswer(inv -> inv.getArgument(0));

        TopicResponse res = topicService.createTopicUnderEvent(1L, request("General"));

        assertThat(res.getName()).isEqualTo("General");
        assertThat(res.getTrackId()).isNull(); // no track attached
    }

    @Test
    void assignTrack_movesTopicToTrack() {
        Topic topic = new Topic();
        topic.setId(7L);
        Track track = track(3L, new Event());
        when(topicRepository.findById(7L)).thenReturn(Optional.of(topic));
        when(trackRepository.findById(3L)).thenReturn(Optional.of(track));

        topicService.assignTrack(7L, 3L);

        assertThat(topic.getTrack()).isEqualTo(track);
        verify(topicRepository).save(topic);
    }

    @Test
    void updateTopic_changesFields() {
        Topic topic = new Topic();
        topic.setId(7L);
        topic.setName("Old");
        when(topicRepository.findById(7L)).thenReturn(Optional.of(topic));
        when(topicRepository.save(any(Topic.class))).thenAnswer(inv -> inv.getArgument(0));

        TopicResponse res = topicService.updateTopic(7L, request("New"));

        assertThat(res.getName()).isEqualTo("New");
    }

    @Test
    void deleteTopic_throws_whenMissing() {
        when(topicRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> topicService.deleteTopic(9L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(topicRepository, never()).delete(any());
    }
}
